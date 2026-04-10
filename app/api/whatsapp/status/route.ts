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
    if (!tenantId) return NextResponse.json({ status: 'disconnected', phone: null })

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('zapi_instance_id, zapi_token, whatsapp_phone')
      .eq('id', tenantId)
      .single()

    const t = tenant as {
      zapi_instance_id: string | null
      zapi_token: string | null
      whatsapp_phone: string | null
    } | null

    if (!t?.zapi_instance_id || !t?.zapi_token) {
      return NextResponse.json({ status: 'not_configured', phone: null })
    }

    const res = await fetch(
      `https://api.z-api.io/instances/${t.zapi_instance_id}/token/${t.zapi_token}/status`,
      { headers: { 'Client-Token': t.zapi_token } }
    )

    if (!res.ok) return NextResponse.json({ status: 'disconnected', phone: null })

    const data = await res.json() as { connected?: boolean; session?: string; smartphoneConnected?: boolean }

    if (data.connected) {
      return NextResponse.json({ status: 'connected', phone: t.whatsapp_phone })
    }

    return NextResponse.json({ status: 'disconnected', phone: null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
