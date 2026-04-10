import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const tenantId = await getViewingTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('slug, whatsapp_instance')
      .eq('id', tenantId)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

    const t = tenant as { slug: string; whatsapp_instance: string | null }
    const instanceName = t.whatsapp_instance || `pg-${t.slug}`

    // Tenta criar a instância (ignora erro se já existe)
    await fetch(`${EVO_URL}/instance/create`, {
      method: 'POST',
      headers: { apikey: EVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          url: `${APP_URL}/api/whatsapp/webhook`,
          byEvents: true,
          base64: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        },
      }),
    })

    // Busca QR Code
    const connectRes = await fetch(`${EVO_URL}/instance/connect/${instanceName}`, {
      headers: { apikey: EVO_KEY },
    })

    if (!connectRes.ok) {
      return NextResponse.json({ error: 'Falha ao gerar QR Code. Verifique a Evolution API.' }, { status: 502 })
    }

    const connectData = await connectRes.json() as { code?: string; base64?: string }

    // Salva instance name no tenant
    await supabaseAdmin
      .from('tenants')
      .update({ whatsapp_instance: instanceName })
      .eq('id', tenantId)

    return NextResponse.json({
      qrcode: connectData.base64 || connectData.code,
      instanceName,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
