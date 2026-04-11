import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import { MessageSquare, User } from 'lucide-react'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function timeAgo(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'ontem'
  if (days < 7) return `${days}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default async function ConversasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  const { data } = await supabaseAdmin
    .from('whatsapp_conversations')
    .select('id, contact_phone, contact_name, last_message, last_message_at, unread_count, lead_id')
    .eq('tenant_id', tenantId)
    .order('last_message_at', { ascending: false })

  const conversations = (data || []) as Array<{
    id: string
    contact_phone: string
    contact_name: string | null
    last_message: string | null
    last_message_at: string
    unread_count: number
    lead_id: string | null
  }>

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Conversas
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Mensagens recebidas no seu WhatsApp conectado
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="card-pg p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <MessageSquare size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            Nenhuma conversa ainda
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Quando alguém enviar uma mensagem para seu WhatsApp conectado, ela aparecerá aqui.
          </p>
          <Link href="/dashboard/conexoes" className="text-sm font-medium mt-1"
            style={{ color: 'var(--accent)' }}>
            Verificar conexão →
          </Link>
        </div>
      ) : (
        <div className="card-pg overflow-hidden">
          {conversations.map((conv, i) => (
            <Link
              key={conv.id}
              href={`/dashboard/conversas/${conv.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[rgba(0,212,200,0.04)] relative"
              style={i > 0 ? { borderTop: '1px solid var(--border-color)' } : {}}
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-semibold"
                style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}>
                {conv.contact_name
                  ? conv.contact_name.charAt(0).toUpperCase()
                  : <User size={18} />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {conv.contact_name || `+${conv.contact_phone}`}
                  </p>
                  <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                    {timeAgo(conv.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {conv.last_message || '—'}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="ml-2 shrink-0 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#25D366', color: '#fff' }}>
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
