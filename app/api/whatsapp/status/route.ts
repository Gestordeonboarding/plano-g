import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ status: 'disconnected', phone: null })

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('zapi_instance_id, zapi_token, whatsapp_phone')
      .eq('id', user.id)
      .single()

    const u = userData as {
      zapi_instance_id: string | null
      zapi_token: string | null
      whatsapp_phone: string | null
    } | null

    if (!u?.zapi_instance_id || !u?.zapi_token) {
      return NextResponse.json({ status: 'not_configured', phone: null })
    }

    const res = await fetch(
      `https://api.z-api.io/instances/${u.zapi_instance_id}/token/${u.zapi_token}/status`,
      { headers: { 'Client-Token': u.zapi_token } }
    )

    if (!res.ok) return NextResponse.json({ status: 'disconnected', phone: null })

    const data = await res.json() as { connected?: boolean }

    return NextResponse.json({
      status: data.connected ? 'connected' : 'disconnected',
      phone: data.connected ? u.whatsapp_phone : null,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
