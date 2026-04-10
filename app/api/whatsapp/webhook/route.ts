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
  senderPhone?: string
  status?: string
  type?: string
  text?: { message?: string }
  image?: { caption?: string }
  connected?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as ZApiPayload

    const instanceId = payload.instanceId
    if (!instanceId) return NextResponse.json({ ok: true })

    // Busca tenant pela instância Z-API
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('zapi_instance_id', instanceId)
      .single()

    if (!tenant) return NextResponse.json({ ok: true })

    const tenantId = (tenant as { id: string }).id

    // Evento de conexão
    if (payload.connected === true && payload.phone) {
      await supabaseAdmin
        .from('tenants')
        .update({ whatsapp_phone: payload.phone })
        .eq('id', tenantId)
      return NextResponse.json({ ok: true })
    }

    // Mensagem recebida — cria lead automaticamente
    if (payload.type === 'ReceivedCallback' && payload.phone) {
      const phone = payload.phone.replace(/\D/g, '')
      const contactName = payload.senderName || phone
      const message = payload.text?.message || payload.image?.caption || ''

      // Verifica se já existe lead com esse número
      const { data: existing } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('phone', phone)
        .single()

      if (!existing) {
        await supabaseAdmin.from('leads').insert({
          tenant_id: tenantId,
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
