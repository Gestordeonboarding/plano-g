import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const EVOLUTION_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY!
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
      .select('zapi_instance_id, name')
      .eq('id', tenantId)
      .single()

    const t = tenant as { zapi_instance_id: string | null; name: string } | null

    if (t?.zapi_instance_id) {
      // Instância já existe — atualiza o webhook para garantir que está correto
      await fetch(`${EVOLUTION_URL}/webhook/set/${t.zapi_instance_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          byEvents: false,
          base64: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        }),
      })
      return NextResponse.json({ instanceName: t.zapi_instance_id })
    }

    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta. Entre em contato com o suporte.' }, { status: 500 })
    }

    const instanceName = `planog-${tenantId.slice(0, 8)}`

    // Create instance in Evolution API
    const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
      },
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          url: WEBHOOK_URL,
          byEvents: false,
          base64: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        },
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      console.error('Evolution create instance error:', createRes.status, err)
      return NextResponse.json({ error: `Erro ao criar conexão (${createRes.status}): ${err}` }, { status: 502 })
    }

    // Save instance name to tenant
    await supabaseAdmin
      .from('tenants')
      .update({ zapi_instance_id: instanceName, zapi_token: null })
      .eq('id', tenantId)

    return NextResponse.json({ instanceName })
  } catch (err) {
    console.error('criar-instancia error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
