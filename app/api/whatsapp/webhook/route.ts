import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type EvoPayload = {
  event: string
  instance: string
  data: {
    key?: {
      remoteJid?: string
      fromMe?: boolean
      id?: string
    }
    pushName?: string
    message?: {
      conversation?: string
      extendedTextMessage?: { text?: string }
      imageMessage?: { caption?: string }
    }
    instance?: { state?: string; wuid?: string }
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as EvoPayload
    const { event, instance: instanceName, data } = payload

    // Busca o tenant pela instância
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('whatsapp_instance', instanceName)
      .single()

    if (!tenant) return NextResponse.json({ ok: true }) // instância não mapeada

    const tenantId = (tenant as { id: string }).id

    // Atualiza status de conexão
    if (event === 'CONNECTION_UPDATE') {
      const state = data.instance?.state
      const phone = data.instance?.wuid?.replace('@s.whatsapp.net', '') || null
      if (state === 'open' && phone) {
        await supabaseAdmin
          .from('tenants')
          .update({ whatsapp_phone: phone })
          .eq('id', tenantId)
      }
      return NextResponse.json({ ok: true })
    }

    // Processa mensagens recebidas → cria leads automáticos
    if (event === 'MESSAGES_UPSERT') {
      const fromMe = data.key?.fromMe
      if (fromMe) return NextResponse.json({ ok: true }) // ignora mensagens enviadas

      const remoteJid = data.key?.remoteJid || ''
      if (remoteJid.includes('@g.us')) return NextResponse.json({ ok: true }) // ignora grupos

      const phoneRaw = remoteJid.replace('@s.whatsapp.net', '')
      const phone = phoneRaw.startsWith('55') ? phoneRaw : `55${phoneRaw}`
      const contactName = data.pushName || phone
      const message =
        data.message?.conversation ||
        data.message?.extendedTextMessage?.text ||
        data.message?.imageMessage?.caption ||
        ''

      // Verifica se já existe lead com esse número
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('phone', phone)
        .single()

      if (!existingLead) {
        // Cria novo lead automaticamente
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

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ ok: true }) // sempre retorna 200 para a Evolution API
  }
}
