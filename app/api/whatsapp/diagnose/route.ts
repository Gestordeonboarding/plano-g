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

/**
 * Endpoint de diagnóstico — retorna:
 * - Estado da instância na Evolution
 * - Webhook config atual
 * - Counts no banco (conversas/mensagens recentes)
 *
 * Útil pra entender por que mensagens não estão sendo recebidas.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, email, zapi_instance_id, whatsapp_phone, tenant_id')
      .eq('id', user.id)
      .single()

    const u = userData as { id: string; email: string; zapi_instance_id: string | null; whatsapp_phone: string | null; tenant_id: string } | null

    if (!u) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    if (!u.zapi_instance_id) {
      return NextResponse.json({
        user: { id: u.id, email: u.email, tenant_id: u.tenant_id },
        error: 'Sem zapi_instance_id configurado',
      })
    }

    const instance = u.zapi_instance_id

    // Função helper pra chamar Evolution e capturar tudo
    async function callEvo(path: string) {
      try {
        const res = await fetch(`${EVOLUTION_URL}${path}`, {
          headers: { 'apikey': EVOLUTION_KEY },
        })
        const text = await res.text()
        let parsed: unknown = text
        try { parsed = JSON.parse(text) } catch { /* deixa text */ }
        return { status: res.status, body: parsed }
      } catch (err) {
        return { status: 0, error: String(err) }
      }
    }

    const [connectionState, webhookFind, fetchInstance] = await Promise.all([
      callEvo(`/instance/connectionState/${instance}`),
      callEvo(`/webhook/find/${instance}`),
      callEvo(`/instance/fetchInstances?instanceName=${instance}`),
    ])

    // Conta conversas e mensagens recentes do tenant
    const { count: convCount } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', u.tenant_id)

    const { count: msgCount } = await supabaseAdmin
      .from('whatsapp_chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', u.tenant_id)

    return NextResponse.json({
      user: {
        id: u.id,
        email: u.email,
        tenant_id: u.tenant_id,
        zapi_instance_id: u.zapi_instance_id,
        whatsapp_phone: u.whatsapp_phone,
      },
      evolution: {
        connectionState,    // diz se está 'open', 'connecting', 'close', etc
        webhookFind,        // mostra URL + eventos inscritos
        fetchInstance,      // info completa da instância
      },
      database: {
        conversationCount: convCount ?? 0,
        messageCount: msgCount ?? 0,
      },
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
