import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ============================================================================
//  Tipos — payload Z-API e payload Evolution
// ============================================================================

// Z-API: cada mensagem chega como ReceivedCallback no topo do payload
interface ZapiPayload {
  type?: string                    // "ReceivedCallback" | "MessageStatusCallback" | etc
  instanceId?: string              // ID da instância Z-API
  connectedPhone?: string          // telefone conectado (dono da instância)
  phone?: string                   // telefone do remetente
  messageId?: string
  fromMe?: boolean
  isGroup?: boolean
  isNewsletter?: boolean
  isStatusReply?: boolean
  broadcast?: boolean
  chatName?: string
  senderName?: string
  momment?: number                 // timestamp (typo do Z-API)
  // Conteúdo (um destes vem preenchido conforme o tipo da mensagem)
  text?: { message?: string }
  image?: { caption?: string; imageUrl?: string }
  video?: { caption?: string; videoUrl?: string }
  audio?: { audioUrl?: string }
  document?: { title?: string; documentUrl?: string }
  sticker?: { stickerUrl?: string }
}

// Evolution: estrutura aninhada em event/data/key
interface EvolutionMessage {
  conversation?: string
  extendedTextMessage?: { text?: string }
  imageMessage?: { caption?: string }
  videoMessage?: { caption?: string }
  documentMessage?: { title?: string }
  audioMessage?: Record<string, unknown>
}

interface EvolutionPayload {
  event?: string
  instance?: string | { instanceName?: string; instance_name?: string }
  data?: {
    key?: { remoteJid?: string; fromMe?: boolean; id?: string }
    pushName?: string
    message?: EvolutionMessage
    state?: string
    qrcode?: { base64?: string; code?: string }
  }
}

// ============================================================================
//  Detecção de formato + normalização
// ============================================================================

type Source = 'zapi' | 'evolution' | 'unknown'

interface Normalized {
  source: Source
  /** ID da instância (pra casar com users.zapi_instance_id) */
  instanceId: string
  /** Telefone do remetente (limpo, só dígitos) */
  senderPhone: string | null
  /** Nome do contato (pushName / senderName / chatName) */
  contactName: string | null
  /** Texto extraído da mensagem (ou descrição da mídia) */
  message: string
  /** É mensagem incoming válida (não fromMe, não newsletter, não grupo, não status)? */
  isValidIncoming: boolean
  /** É evento de conexão estabelecida? */
  isConnectionOpen: boolean
  /** Telefone do dono da instância (pra connection events) */
  connectedPhone: string | null
  /** Razão de descarte (debug) */
  skipReason?: string
}

function normalizePayload(raw: unknown): Normalized {
  const p = raw as Record<string, unknown>

  // ── Z-API: tem `type` no topo (ReceivedCallback, ConnectedCallback, etc.) ──
  if (typeof p.type === 'string' && typeof p.instanceId === 'string') {
    const z = raw as ZapiPayload
    const instanceId = z.instanceId ?? ''
    const connectedPhone = z.connectedPhone?.replace(/\D/g, '') ?? null

    // Connection events
    if (z.type === 'ConnectedCallback') {
      return {
        source: 'zapi',
        instanceId,
        senderPhone: null,
        contactName: null,
        message: '',
        isValidIncoming: false,
        isConnectionOpen: true,
        connectedPhone,
      }
    }

    // Não é mensagem? Ignora
    if (z.type !== 'ReceivedCallback') {
      return {
        source: 'zapi',
        instanceId,
        senderPhone: null,
        contactName: null,
        message: '',
        isValidIncoming: false,
        isConnectionOpen: false,
        connectedPhone,
        skipReason: `type ${z.type} ignorado`,
      }
    }

    // Filtros: fromMe, newsletter, grupo, status reply, broadcast
    if (z.fromMe) {
      return { source: 'zapi', instanceId, senderPhone: null, contactName: null, message: '', isValidIncoming: false, isConnectionOpen: false, connectedPhone, skipReason: 'fromMe' }
    }
    if (z.isNewsletter) {
      return { source: 'zapi', instanceId, senderPhone: null, contactName: null, message: '', isValidIncoming: false, isConnectionOpen: false, connectedPhone, skipReason: 'newsletter' }
    }
    if (z.isGroup) {
      return { source: 'zapi', instanceId, senderPhone: null, contactName: null, message: '', isValidIncoming: false, isConnectionOpen: false, connectedPhone, skipReason: 'grupo' }
    }
    if (z.isStatusReply || z.broadcast) {
      return { source: 'zapi', instanceId, senderPhone: null, contactName: null, message: '', isValidIncoming: false, isConnectionOpen: false, connectedPhone, skipReason: 'status/broadcast' }
    }

    const rawPhone = z.phone ?? ''
    // Ignora se phone contém @ (newsletters, grupos ainda escapados)
    if (rawPhone.includes('@')) {
      return { source: 'zapi', instanceId, senderPhone: null, contactName: null, message: '', isValidIncoming: false, isConnectionOpen: false, connectedPhone, skipReason: 'phone com @ (canal/grupo)' }
    }

    const senderPhone = rawPhone.replace(/\D/g, '')
    if (!senderPhone) {
      return { source: 'zapi', instanceId, senderPhone: null, contactName: null, message: '', isValidIncoming: false, isConnectionOpen: false, connectedPhone, skipReason: 'phone vazio' }
    }

    // Extrai conteúdo: prioridade pra texto, depois caption, depois marker de mídia
    let msg =
      z.text?.message ||
      z.image?.caption ||
      z.video?.caption ||
      z.document?.title ||
      ''
    if (!msg) {
      if (z.image) msg = '📷 Imagem'
      else if (z.video) msg = '🎥 Vídeo'
      else if (z.audio) msg = '🎵 Áudio'
      else if (z.document) msg = '📎 Documento'
      else if (z.sticker) msg = '🎟️ Figurinha'
      else msg = '(mensagem)'
    }

    const contactName = z.senderName || z.chatName || senderPhone

    return {
      source: 'zapi',
      instanceId,
      senderPhone,
      contactName,
      message: msg,
      isValidIncoming: true,
      isConnectionOpen: false,
      connectedPhone,
    }
  }

  // ── Evolution: tem `event` e `instance` no topo ──────────────────────────
  if (typeof p.event === 'string') {
    const e = raw as EvolutionPayload
    const rawInstance = e.instance
    const instanceId =
      typeof rawInstance === 'string'
        ? rawInstance
        : (rawInstance?.instanceName ?? rawInstance?.instance_name ?? '')

    // Connection update
    if (e.event === 'connection.update') {
      return {
        source: 'evolution',
        instanceId,
        senderPhone: null,
        contactName: null,
        message: '',
        isValidIncoming: false,
        isConnectionOpen: e.data?.state === 'open',
        connectedPhone: null,
      }
    }

    // Não é mensagem
    if (e.event !== 'messages.upsert') {
      return {
        source: 'evolution',
        instanceId,
        senderPhone: null,
        contactName: null,
        message: '',
        isValidIncoming: false,
        isConnectionOpen: false,
        connectedPhone: null,
        skipReason: `event ${e.event} ignorado`,
      }
    }

    // Filtros
    if (e.data?.key?.fromMe) {
      return { source: 'evolution', instanceId, senderPhone: null, contactName: null, message: '', isValidIncoming: false, isConnectionOpen: false, connectedPhone: null, skipReason: 'fromMe' }
    }
    const remoteJid = e.data?.key?.remoteJid ?? ''
    if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid.endsWith('@newsletter')) {
      return { source: 'evolution', instanceId, senderPhone: null, contactName: null, message: '', isValidIncoming: false, isConnectionOpen: false, connectedPhone: null, skipReason: 'grupo/newsletter' }
    }

    const senderPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
    const m = e.data?.message
    let msg =
      m?.conversation ||
      m?.extendedTextMessage?.text ||
      m?.imageMessage?.caption ||
      m?.videoMessage?.caption ||
      m?.documentMessage?.title ||
      ''
    if (!msg) {
      if (m?.imageMessage) msg = '📷 Imagem'
      else if (m?.videoMessage) msg = '🎥 Vídeo'
      else if (m?.audioMessage) msg = '🎵 Áudio'
      else if (m?.documentMessage) msg = '📎 Documento'
      else msg = '(mensagem)'
    }

    return {
      source: 'evolution',
      instanceId,
      senderPhone,
      contactName: e.data?.pushName ?? senderPhone,
      message: msg,
      isValidIncoming: true,
      isConnectionOpen: false,
      connectedPhone: null,
    }
  }

  // Formato desconhecido
  return {
    source: 'unknown',
    instanceId: '',
    senderPhone: null,
    contactName: null,
    message: '',
    isValidIncoming: false,
    isConnectionOpen: false,
    connectedPhone: null,
    skipReason: 'formato desconhecido',
  }
}

// ============================================================================
//  Resolução do dono (user / tenant) — tenta múltiplos critérios
// ============================================================================

interface OwnerResolution {
  tenantId: string | null
  userId: string | null
  via: string  // como achou (debug)
}

async function resolveOwner(instanceId: string, connectedPhone: string | null): Promise<OwnerResolution> {
  // Normaliza pra evitar problemas com espaços ou casos diferentes
  const cleanedInstanceId = instanceId.trim()
  const cleanedPhone = connectedPhone?.trim() ?? null

  console.log('[whatsapp-webhook] resolveOwner inputs:', {
    instanceIdLen: cleanedInstanceId.length,
    instanceIdBytes: Array.from(cleanedInstanceId).slice(0, 30).map((c) => c.charCodeAt(0)).join(','),
    instanceIdValue: JSON.stringify(cleanedInstanceId),
    connectedPhone: cleanedPhone,
  })

  // Tenta 1: zapi_instance_id em users (match exato)
  if (cleanedInstanceId) {
    const { data: u, error: uErr } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id, email, zapi_instance_id')
      .eq('zapi_instance_id', cleanedInstanceId)
      .maybeSingle()
    console.log('[whatsapp-webhook] busca em users (exact):', {
      found: !!u,
      error: uErr?.message,
      row: u,
    })
    if (u) {
      const x = u as { id: string; tenant_id: string }
      return { tenantId: x.tenant_id, userId: x.id, via: 'users.zapi_instance_id (exact)' }
    }

    // Tenta 1b: busca case-insensitive (ilike) — pega valores com case diferente
    const { data: uIlike } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id, email, zapi_instance_id')
      .ilike('zapi_instance_id', cleanedInstanceId)
      .maybeSingle()
    if (uIlike) {
      const x = uIlike as { id: string; tenant_id: string }
      console.log('[whatsapp-webhook] match via ilike (case-insensitive):', x)
      return { tenantId: x.tenant_id, userId: x.id, via: 'users.zapi_instance_id (ilike)' }
    }

    // Tenta 2: zapi_instance_id em tenants (legado)
    const { data: t } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('zapi_instance_id', cleanedInstanceId)
      .maybeSingle()
    if (t) {
      return { tenantId: (t as { id: string }).id, userId: null, via: 'tenants.zapi_instance_id' }
    }
  }

  // Tenta 3: whatsapp_phone em users (fallback quando instanceId não bate)
  if (cleanedPhone) {
    const { data: u } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id')
      .eq('whatsapp_phone', cleanedPhone)
      .maybeSingle()
    if (u) {
      const x = u as { id: string; tenant_id: string }
      return { tenantId: x.tenant_id, userId: x.id, via: 'users.whatsapp_phone' }
    }
  }

  return { tenantId: null, userId: null, via: 'não encontrado' }
}

// ============================================================================
//  Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json() as unknown
    const norm = normalizePayload(raw)

    console.log('[whatsapp-webhook]', {
      source: norm.source,
      instanceId: norm.instanceId,
      senderPhone: norm.senderPhone,
      message: norm.message,
      isValidIncoming: norm.isValidIncoming,
      isConnectionOpen: norm.isConnectionOpen,
      skipReason: norm.skipReason,
    })

    // Resolve dono
    const owner = await resolveOwner(norm.instanceId, norm.connectedPhone)
    if (!owner.tenantId) {
      console.warn('[whatsapp-webhook] dono não identificado', {
        instanceId: norm.instanceId,
        connectedPhone: norm.connectedPhone,
      })
      return NextResponse.json({ ok: true })
    }

    console.log('[whatsapp-webhook] dono:', { via: owner.via, userId: owner.userId, tenantId: owner.tenantId })

    // ── Connection event: atualiza telefone/nome conectado ──────────────────
    if (norm.isConnectionOpen && norm.connectedPhone) {
      if (owner.userId) {
        await supabaseAdmin
          .from('users')
          .update({ whatsapp_phone: norm.connectedPhone })
          .eq('id', owner.userId)
      } else {
        await supabaseAdmin
          .from('tenants')
          .update({ whatsapp_phone: norm.connectedPhone })
          .eq('id', owner.tenantId)
      }
      return NextResponse.json({ ok: true })
    }

    // ── Mensagem válida: salva conversa + mensagem ──────────────────────────
    if (!norm.isValidIncoming || !norm.senderPhone) {
      return NextResponse.json({ ok: true })
    }

    // 1. Acha ou cria conversa
    const { data: existingConv } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, unread_count')
      .eq('tenant_id', owner.tenantId)
      .eq('contact_phone', norm.senderPhone)
      .single()

    let conversationId: string

    if (existingConv) {
      const c = existingConv as { id: string; unread_count: number }
      conversationId = c.id
      await supabaseAdmin
        .from('whatsapp_conversations')
        .update({
          last_message: norm.message || '📎 Mídia',
          last_message_at: new Date().toISOString(),
          unread_count: (c.unread_count ?? 0) + 1,
          contact_name: norm.contactName,
        })
        .eq('id', conversationId)
    } else {
      // Acha ou cria lead pra esse telefone
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('tenant_id', owner.tenantId)
        .eq('phone', norm.senderPhone)
        .single()

      let leadId: string | null = existingLead ? (existingLead as { id: string }).id : null

      if (!leadId) {
        const { data: newLead } = await supabaseAdmin
          .from('leads')
          .insert({
            tenant_id: owner.tenantId,
            full_name: norm.contactName,
            phone: norm.senderPhone,
            source: 'whatsapp',
            status: 'novo',
            notes: norm.message ? `Primeira mensagem: "${norm.message}"` : null,
            qualification_score: 0,
          })
          .select('id')
          .single()
        if (newLead) leadId = (newLead as { id: string }).id
      }

      const { data: newConv } = await supabaseAdmin
        .from('whatsapp_conversations')
        .insert({
          tenant_id: owner.tenantId,
          ...(owner.userId ? { seller_id: owner.userId } : {}),
          contact_phone: norm.senderPhone,
          contact_name: norm.contactName,
          lead_id: leadId,
          last_message: norm.message || '📎 Mídia',
          last_message_at: new Date().toISOString(),
          unread_count: 1,
        })
        .select('id')
        .single()
      conversationId = (newConv as { id: string }).id
    }

    // 2. Salva mensagem
    await supabaseAdmin.from('whatsapp_chat_messages').insert({
      conversation_id: conversationId,
      tenant_id: owner.tenantId,
      direction: 'incoming',
      content: norm.message,
      sent_at: new Date().toISOString(),
    })

    console.log('[whatsapp-webhook] mensagem salva em', conversationId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[whatsapp-webhook] erro:', err)
    return NextResponse.json({ ok: true })
  }
}
