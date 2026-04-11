import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import ChatView from './ChatView'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function ConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  // Get conversation
  const { data: conv } = await supabaseAdmin
    .from('whatsapp_conversations')
    .select('id, contact_phone, contact_name, tenant_id, lead_id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!conv) redirect('/dashboard/conversas')

  const conversation = conv as {
    id: string
    contact_phone: string
    contact_name: string | null
    tenant_id: string
    lead_id: string | null
  }

  // Get messages
  const { data: msgs } = await supabaseAdmin
    .from('whatsapp_chat_messages')
    .select('id, direction, content, sent_at')
    .eq('conversation_id', id)
    .order('sent_at', { ascending: true })

  const messages = (msgs || []) as Array<{
    id: string
    direction: 'incoming' | 'outgoing'
    content: string | null
    sent_at: string
  }>

  // Mark as read
  await supabaseAdmin
    .from('whatsapp_conversations')
    .update({ unread_count: 0 })
    .eq('id', id)

  const contactName = conversation.contact_name || `+${conversation.contact_phone}`

  return (
    <div className="flex flex-col h-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 mb-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Link href="/dashboard/conversas"
          className="p-2 rounded-lg transition-colors hover:bg-[rgba(0,0,0,0.05)]"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold"
          style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}>
          {conversation.contact_name
            ? conversation.contact_name.charAt(0).toUpperCase()
            : <User size={16} />}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {contactName}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            +{conversation.contact_phone}
          </p>
        </div>
        {conversation.lead_id && (
          <Link href={`/dashboard/leads`}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}>
            Ver Lead →
          </Link>
        )}
      </div>

      <ChatView
        conversationId={id}
        initialMessages={messages}
        contactName={contactName}
      />
    </div>
  )
}
