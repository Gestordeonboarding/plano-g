import { NextResponse } from 'next/server'
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

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ status: 'disconnected', phone: null })

    const tenantId = await getViewingTenantId()
    if (!tenantId) return NextResponse.json({ status: 'disconnected', phone: null })

    const { data: tenantData } = await supabaseAdmin
      .from('tenants')
      .select('zapi_instance_id, whatsapp_phone')
      .eq('id', tenantId)
      .single()

    const t = tenantData as { zapi_instance_id: string | null; whatsapp_phone: string | null } | null

    if (!t?.zapi_instance_id) {
      return NextResponse.json({ status: 'not_configured', phone: null })
    }

    // Evolution API: GET /instance/connectionState/{instanceName}
    // Returns { instance: { instanceName: "...", state: "open" | "close" | "connecting" } }
    const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${t.zapi_instance_id}`, {
      headers: { 'apikey': EVOLUTION_KEY },
    })

    if (!res.ok) return NextResponse.json({ status: 'disconnected', phone: null })

    const data = await res.json() as { instance?: { state?: string } }
    const state = data.instance?.state

    return NextResponse.json({
      status: state === 'open' ? 'connected' : 'disconnected',
      phone: state === 'open' ? t.whatsapp_phone : null,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
