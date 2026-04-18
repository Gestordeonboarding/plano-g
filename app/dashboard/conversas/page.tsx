import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import { createClient as createAdmin } from '@supabase/supabase-js'
import ConversasClient from './ConversasClient'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type Conversation = {
  id: string
  contact_phone: string
  contact_name: string | null
  last_message: string | null
  last_message_at: string
  unread_count: number
  lead_id: string | null
}

export default async function ConversasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single()

  const role = (userData as { role: string } | null)?.role || 'seller'
  const isSeller = role === 'seller'

  let conversations: Conversation[] = []

  if (isSeller) {
    const { data } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, contact_phone, contact_name, last_message, last_message_at, unread_count, lead_id')
      .eq('tenant_id', tenantId)
      .eq('seller_id', user!.id)
      .order('last_message_at', { ascending: false })
    conversations = (data || []) as Conversation[]
  } else {
    const { data } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, contact_phone, contact_name, last_message, last_message_at, unread_count, lead_id')
      .eq('tenant_id', tenantId)
      .order('last_message_at', { ascending: false })
    conversations = (data || []) as Conversation[]
  }

  return <ConversasClient conversations={conversations} />
}
