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

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const tenantId = await getViewingTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('whatsapp_instance, whatsapp_phone')
      .eq('id', tenantId)
      .single()

    const t = tenant as { whatsapp_instance: string | null; whatsapp_phone: string | null } | null
    if (!t?.whatsapp_instance) {
      return NextResponse.json({ status: 'disconnected', phone: null })
    }

    const res = await fetch(`${EVO_URL}/instance/connectionState/${t.whatsapp_instance}`, {
      headers: { apikey: EVO_KEY },
    })

    if (!res.ok) return NextResponse.json({ status: 'disconnected', phone: null })

    const data = await res.json() as { instance?: { state?: string } }
    const state = data.instance?.state

    if (state === 'open') {
      // Buscar número conectado
      const profileRes = await fetch(`${EVO_URL}/instance/fetchInstances`, {
        headers: { apikey: EVO_KEY },
      })
      const instances = await profileRes.json() as Array<{
        instance: { instanceName: string; status: string; owner?: string }
      }>
      const inst = instances.find((i) => i.instance.instanceName === t.whatsapp_instance)
      const phone = inst?.instance?.owner?.replace('@s.whatsapp.net', '') || null

      if (phone && phone !== t.whatsapp_phone) {
        await supabaseAdmin.from('tenants').update({ whatsapp_phone: phone }).eq('id', tenantId)
      }

      return NextResponse.json({ status: 'connected', phone })
    }

    return NextResponse.json({ status: state || 'disconnected', phone: null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
