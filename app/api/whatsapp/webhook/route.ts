import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type ZApiPayload = {
  instanceId?: string
  phone?: string
  senderName?: string
  type?: string
  connected?: boolean
  text?: { message?: string }
  image?: { caption?: string }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as ZApiPayload
    const { instanceId } = payload

    if (!instanceId) return NextResponse.json({ ok: true })

    // Busca o usuário (vendedor/admin) dono desta instância
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id, full_name')
      .eq('zapi_instance_id', instanceId)
      .single()

    if (!userData) return NextResponse.json({ ok: true })

    const u = userData as { id: string; tenant_id: string; full_name: string | null }

    // Evento de conexão — salva o número conectado
    if (payload.connected === true && payload.phone) {
      await supabaseAdmin
        .from('users')
        .update({ whatsapp_phone: payload.phone })
        .eq('id', u.id)
      return NextResponse.json({ ok: true })
    }

    // Mensagem recebida → cria lead automaticamente
    if (payload.type === 'ReceivedCallback' && payload.phone) {
      const phone = payload.phone.replace(/\D/g, '')
      const contactName = payload.senderName || phone
      const message = payload.text?.message || payload.image?.caption || ''

      // Verifica se já existe lead com esse número neste tenant
      const { data: existing } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('tenant_id', u.tenant_id)
        .eq('phone', phone)
        .single()

      if (!existing) {
        await supabaseAdmin.from('leads').insert({
          tenant_id: u.tenant_id,
          seller_id: u.id,
          full_name: contactName,
          phone,
          source: 'whatsapp',
          status: 'novo',
          notes: message ? `Primeira mensagem: "${message}"` : null,
          qualification_score: 0,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook Z-API error:', err)
    return NextResponse.json({ ok: true })
  }
}
