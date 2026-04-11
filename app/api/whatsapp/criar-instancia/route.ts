import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ZAPI_ACCOUNT_TOKEN = process.env.ZAPI_ACCOUNT_TOKEN!
const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const tenantId = await getViewingTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })

    // Check if already has instance
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('zapi_instance_id, zapi_token, name')
      .eq('id', tenantId)
      .single()

    const t = tenant as { zapi_instance_id: string | null; zapi_token: string | null; name: string } | null

    if (t?.zapi_instance_id && t?.zapi_token) {
      // Already configured — just return existing credentials
      return NextResponse.json({ instanceId: t.zapi_instance_id, token: t.zapi_token })
    }

    if (!ZAPI_ACCOUNT_TOKEN) {
      return NextResponse.json({ error: 'Configuração da agência incompleta. Entre em contato com o suporte.' }, { status: 500 })
    }

    // Create new Z-API instance automatically
    const slug = tenantId.slice(0, 8)
    const instanceName = `planog-${slug}`

    const createRes = await fetch('https://api.z-api.io/instances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_ACCOUNT_TOKEN,
      },
      body: JSON.stringify({ name: instanceName }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      console.error('Z-API create instance error:', err)
      return NextResponse.json({ error: 'Não foi possível criar a conexão. Tente novamente.' }, { status: 502 })
    }

    const created = await createRes.json() as {
      id?: string
      token?: string
      instanceId?: string
    }

    const instanceId = created.id || created.instanceId
    const instanceToken = created.token

    if (!instanceId || !instanceToken) {
      return NextResponse.json({ error: 'Resposta inesperada ao criar conexão.' }, { status: 502 })
    }

    // Set webhook automatically
    await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/update-webhook-received`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': ZAPI_ACCOUNT_TOKEN,
        },
        body: JSON.stringify({ value: WEBHOOK_URL }),
      }
    )

    // Save to tenant
    await supabaseAdmin
      .from('tenants')
      .update({ zapi_instance_id: instanceId, zapi_token: instanceToken })
      .eq('id', tenantId)

    return NextResponse.json({ instanceId, token: instanceToken })
  } catch (err) {
    console.error('criar-instancia error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
