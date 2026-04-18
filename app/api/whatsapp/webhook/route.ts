import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Evolution API webhook payload types
type EvolutionMessage = {
  conversation?: string
  extendedTextMessage?: { text?: string }
  imageMessage?: { caption?: string }
  videoMessage?: { caption?: string }
  documentMessage?: { title?: string }
  audioMessage?: Record<string, unknown>
}

type EvolutionPayload = {
  event: string
  instance: string
  data?: {
    key?: { remoteJid?: string; fromMe?: boolean; id?: string }
    pushName?: string
    message?: EvolutionMessage
    state?: string
    qrcode?: { base64?: string; code?: string }
  }
}

function extractMessage(message?: EvolutionMessage): string {
  if (!message) return ''
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.title ||
    (message.audioMessage ? '🎵 Áudio' : '') ||
    ''
  )
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as EvolutionPayload
    const { event, instance: instanceName, data } = payload

    if (!instanceName) return NextResponse.json({ ok: true })

    // Find tenant by instance name (stored in zapi_instance_id column)
    const { data: tenantData } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('zapi_instance_id', instanceName)
      .single()

    if (!tenantData) return NextResponse.json({ ok: true })

    const tenantId = (tenantData as { id: string }).id

    // ── Connection state update ──────────────────────────────────────────────
    if (event === 'connection.update') {
      if (data?.state === 'open') {
        // Busca o número de telefone via Evolution API
        try {
          const evolutionUrl = process.env.EVOLUTION_API_URL
          const evolutionKey = process.env.EVOLUTION_API_KEY
          if (evolutionUrl && evolutionKey) {
            const infoRes = await fetch(
              `${evolutionUrl}/instance/fetchInstances?instanceName=${instanceName}`,
              { headers: { apikey: evolutionKey } }
            )
            if (infoRes.ok) {
              const infoData = await infoRes.json() as Array<{ owner?: string; profileName?: string }>
              const instance = Array.isArray(infoData) ? infoData[0] : infoData
              const owner = (instance as { owner?: string })?.owner
              const profileName = (instance as { profileName?: string })?.profileName
              const phone = owner?.replace('@s.whatsapp.net', '').replace(/\D/g, '') || null
              await supabaseAdmin
                .from('tenants')
                .update({
                  whatsapp_phone: phone,
                  ...(profileName ? { whatsapp_name: profileName } : {}),
                })
                .eq('zapi_instance_id', instanceName)
            }
          }
        } catch (e) {
          console.error('Error fetching instance info:', e)
        }
      }
      return NextResponse.json({ ok: true })
    }

    // ── Incoming message ─────────────────────────────────────────────────────
    if (event === 'messages.upsert') {
      // Ignore messages sent by us
      if (data?.key?.fromMe) return NextResponse.json({ ok: true })

      const remoteJid = data?.key?.remoteJid || ''
      // remoteJid format: "5511999999999@s.whatsapp.net" or "5511999999999@g.us" (group)
      if (!remoteJid || remoteJid.endsWith('@g.us')) return NextResponse.json({ ok: true })

      const phone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
      const contactName = data?.pushName || phone
      const message = extractMessage(data?.message)

      // 1. Find or create conversation
      const { data: existingConv } = await supabaseAdmin
        .from('whatsapp_conversations')
        .select('id, unread_count')
        .eq('tenant_id', tenantId)
        .eq('contact_phone', phone)
        .single()

      let conversationId: string

      if (existingConv) {
        const c = existingConv as { id: string; unread_count: number }
        conversationId = c.id
        await supabaseAdmin
          .from('whatsapp_conversations')
          .update({
            last_message: message || '📎 Mídia',
            last_message_at: new Date().toISOString(),
            unread_count: c.unread_count + 1,
            contact_name: contactName,
          })
          .eq('id', conversationId)
      } else {
        // Check/create lead
        const { data: existingLead } = await supabaseAdmin
          .from('leads')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('phone', phone)
          .single()

        let leadId: string | null = existingLead ? (existingLead as { id: string }).id : null

        if (!leadId) {
          const { data: newLead } = await supabaseAdmin
            .from('leads')
            .insert({
              tenant_id: tenantId,
              full_name: contactName,
              phone,
              source: 'whatsapp',
              status: 'novo',
              notes: message ? `Primeira mensagem: "${message}"` : null,
              qualification_score: 0,
            })
            .select('id')
            .single()
          if (newLead) leadId = (newLead as { id: string }).id
        }

        const { data: newConv } = await supabaseAdmin
          .from('whatsapp_conversations')
          .insert({
            tenant_id: tenantId,
            contact_phone: phone,
            contact_name: contactName,
            lead_id: leadId,
            last_message: message || '📎 Mídia',
            last_message_at: new Date().toISOString(),
            unread_count: 1,
          })
          .select('id')
          .single()
        conversationId = (newConv as { id: string }).id
      }

      // 2. Store message
      if (message) {
        await supabaseAdmin.from('whatsapp_chat_messages').insert({
          conversation_id: conversationId,
          tenant_id: tenantId,
          direction: 'incoming',
          content: message,
          sent_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook Evolution error:', err)
    return NextResponse.json({ ok: true })
  }
}
