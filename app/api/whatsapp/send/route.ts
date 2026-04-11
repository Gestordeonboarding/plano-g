import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const tenantId = await getViewingTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })

    const { conversationId, message } = await request.json() as { conversationId: string; message: string }
    if (!conversationId || !message?.trim()) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Get conversation (validate ownership)
    const { data: conv } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, contact_phone, tenant_id')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single()

    if (!conv) return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    const conversation = conv as { id: string; contact_phone: string; tenant_id: string }

    // Get tenant Z-API credentials
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('zapi_instance_id, zapi_token')
      .eq('id', tenantId)
      .single()

    const t = tenant as { zapi_instance_id: string | null; zapi_token: string | null } | null
    if (!t?.zapi_instance_id || !t?.zapi_token) {
      return NextResponse.json({ error: 'WhatsApp não configurado para este escritório' }, { status: 400 })
    }

    // Send via Z-API
    const zapiRes = await fetch(
      `https://api.z-api.io/instances/${t.zapi_instance_id}/token/${t.zapi_token}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Token': t.zapi_token },
        body: JSON.stringify({ phone: conversation.contact_phone, message: message.trim() }),
      }
    )

    if (!zapiRes.ok) {
      return NextResponse.json({ error: 'Falha ao enviar via WhatsApp' }, { status: 502 })
    }

    // Store outgoing message
    const now = new Date().toISOString()
    const { data: newMsg } = await supabaseAdmin
      .from('whatsapp_chat_messages')
      .insert({
        conversation_id: conversationId,
        tenant_id: tenantId,
        direction: 'outgoing',
        content: message.trim(),
        sent_at: now,
      })
      .select('id, direction, content, sent_at')
      .single()

    // Update conversation last message
    await supabaseAdmin
      .from('whatsapp_conversations')
      .update({ last_message: message.trim(), last_message_at: now })
      .eq('id', conversationId)

    return NextResponse.json({ message: newMsg })
  } catch (err) {
    console.error('Send error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
