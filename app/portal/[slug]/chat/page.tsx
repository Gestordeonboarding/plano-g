import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatClient from './ChatClient'

export default async function ChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/portal/${slug}/login`)

  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) redirect(`/portal/${slug}/login`)

  const tenantId = (tenant as { id: string }).id

  const { data: con } = await supabase
    .from('consorciados')
    .select('id, full_name, seller_id')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!con) redirect(`/portal/${slug}`)

  const c = con as { id: string; full_name: string; seller_id: string | null }

  // Buscar nome do corretor
  let sellerName = 'Corretor'
  if (c.seller_id) {
    const { data: seller } = await supabase
      .from('users').select('full_name').eq('id', c.seller_id).single()
    if (seller) sellerName = (seller as { full_name: string | null }).full_name || 'Corretor'
  }

  // Buscar mensagens iniciais
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('consorciado_id', c.id)
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header do chat */}
      <div
        className="flex items-center gap-3 pb-4 mb-4 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
          style={{ backgroundColor: 'var(--tenant-primary)', color: 'var(--bg-primary)' }}
        >
          {sellerName[0]}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{sellerName}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Seu corretor</p>
        </div>
      </div>

      <ChatClient
        consorciado={c}
        tenantId={tenantId}
        userId={user.id}
        initialMessages={(messages || []) as Record<string, unknown>[]}
      />
    </div>
  )
}
