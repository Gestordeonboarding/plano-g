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

    // Find owner — first check tenants (main connection), then users (per-seller)
    let tenantId: string | null = null
    let sellerId: string | null = null

    const { data: tenantData } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('zapi_instance_id', instanceId)
      .single()

    if (tenantData) {
      tenantId = (tenantData as { id: string }).id
    } else {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id, tenant_id')
        .eq('zapi_instance_id', instanceId)
        .single()
      if (userData) {
        const u = userData as { id: string; tenant_id: string }
        tenantId = u.tenant_id
        sellerId = u.id
      }
    }

    if (!tenantId) return NextResponse.json({ ok: true })

    // Connection event — save phone number
    if (payload.connected === true && payload.phone) {
      if (sellerId) {
        await supabaseAdmin.from('users').update({ whatsapp_phone: payload.phone }).eq('id', sellerId)
      } else {
        await supabaseAdmin.from('tenants').update({ whatsapp_phone: payload.phone }).eq('id', tenantId)
      }
      return NextResponse.json({ ok: true })
    }

    // Incoming message
    if (payload.type === 'ReceivedCallback' && payload.phone) {
      const phone = payload.phone.replace(/\D/g, '')
      const contactName = payload.senderName || phone
      const message = payload.text?.message || payload.image?.caption || ''

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
              seller_id: sellerId,
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
    console.error('Webhook Z-API error:', err)
    return NextResponse.json({ ok: true })
  }
}
