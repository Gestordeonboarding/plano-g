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

  const role = (userData as { role: string } | null)?.role ?? 'seller'
  const isSeller = role === 'seller'
  const userId = user!.id

  const { data: raw } = await supabaseAdmin
    .from('whatsapp_conversations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('last_message_at', { ascending: false })

  const rows = (raw ?? []) as Array<Record<string, unknown>>

  const conversations = rows
    .filter((c) => !isSeller || !c.seller_id || c.seller_id === userId)
    .map((c) => ({
      id: c.id as string,
      contact_phone: c.contact_phone as string,
      contact_name: (c.contact_name ?? null) as string | null,
      last_message: (c.last_message ?? null) as string | null,
      last_message_at: c.last_message_at as string,
      unread_count: (c.unread_count as number) ?? 0,
      lead_id: (c.lead_id ?? null) as string | null,
    }))

  return <ConversasClient conversations={conversations} />
}
