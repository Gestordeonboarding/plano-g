import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import LeadDetail from './LeadDetail'

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = (userData as { role: string } | null)?.role || 'seller'

  const query = supabase.from('leads').select('*').eq('id', id)
  const { data: lead } = role === 'seller'
    ? await query.eq('seller_id', user.id).single()
    : await query.single()
  if (!lead) notFound()

  const { data: sellers } = await supabase
    .from('users').select('id, full_name, email').eq('tenant_id', (lead as { tenant_id: string }).tenant_id)

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/leads" className="flex items-center gap-2 text-sm mb-6 hover:underline"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={14} /> Voltar para leads
      </Link>
      <LeadDetail lead={lead as Record<string, unknown>} sellers={(sellers || []) as Record<string, unknown>[]} />
    </div>
  )
}
