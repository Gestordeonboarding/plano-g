import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const tenantId = await getViewingTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('zapi_instance_id, zapi_token')
      .eq('id', tenantId)
      .single()

    const t = tenant as { zapi_instance_id: string | null; zapi_token: string | null } | null

    if (!t?.zapi_instance_id || !t?.zapi_token) {
      return NextResponse.json({
        error: 'WhatsApp não configurado. Peça ao administrador para configurar a instância Z-API deste escritório.',
      }, { status: 422 })
    }

    const res = await fetch(
      `https://api.z-api.io/instances/${t.zapi_instance_id}/token/${t.zapi_token}/qr-code`,
      { headers: { 'Client-Token': t.zapi_token } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Falha ao gerar QR Code' }, { status: 502 })
    }

    const data = await res.json() as { value?: string; error?: string }

    if (!data.value) {
      return NextResponse.json({ error: data.error || 'QR Code não disponível' }, { status: 502 })
    }

    return NextResponse.json({ qrcode: data.value })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
