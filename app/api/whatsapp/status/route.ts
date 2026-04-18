import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

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

    // Busca instância do usuário logado
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('zapi_instance_id, whatsapp_phone')
      .eq('id', user.id)
      .single()

    const u = userData as { zapi_instance_id: string | null; whatsapp_phone: string | null } | null

    if (!u?.zapi_instance_id) {
      return NextResponse.json({ status: 'not_configured', phone: null })
    }

    // Verifica estado no Evolution API
    const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${u.zapi_instance_id}`, {
      headers: { 'apikey': EVOLUTION_KEY },
    })

    if (!res.ok) return NextResponse.json({ status: 'disconnected', phone: u.whatsapp_phone })

    const data = await res.json() as { instance?: { state?: string } }
    const state = data.instance?.state
    const connected = state === 'open'

    // Se conectado mas sem telefone salvo, busca agora
    if (connected && !u.whatsapp_phone) {
      try {
        const infoRes = await fetch(
          `${EVOLUTION_URL}/instance/fetchInstances?instanceName=${u.zapi_instance_id}`,
          { headers: { 'apikey': EVOLUTION_KEY } }
        )
        if (infoRes.ok) {
          const infoData = await infoRes.json() as Array<{ owner?: string; profileName?: string }>
          const instance = Array.isArray(infoData) ? infoData[0] : infoData
          const owner = (instance as { owner?: string })?.owner
          const phone = owner?.replace('@s.whatsapp.net', '').replace(/\D/g, '') || null
          if (phone) {
            await supabaseAdmin
              .from('users')
              .update({ whatsapp_phone: phone })
              .eq('id', user.id)
            return NextResponse.json({ status: 'connected', phone })
          }
        }
      } catch { /* ignora */ }
    }

    return NextResponse.json({
      status: connected ? 'connected' : 'disconnected',
      phone: connected ? u.whatsapp_phone : null,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
