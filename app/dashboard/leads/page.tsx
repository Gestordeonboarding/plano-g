import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import KanbanClient from './KanbanClient'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = (userData as { role: string } | null)?.role || 'tenant_admin'
  const isSeller = role === 'seller'
  const isManager = !isSeller

  const leadsQuery = supabase
    .from('leads')
    .select('id, full_name, phone, desired_credit, asset_type, qualification_score, source, status, created_at, seller_id')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const { data: leadsData } = isSeller
    ? await leadsQuery.eq('seller_id', user.id)
    : await leadsQuery

  let sellersData: Array<{ id: string; full_name: string | null; email: string | null }> = []
  if (isManager) {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('tenant_id', tenantId)
    sellersData = (data || []) as typeof sellersData
  }

  const leads = (leadsData || []) as Array<{
    id: string; full_name: string; phone: string; desired_credit: number | null
    asset_type: string | null; qualification_score: number; source: string
    status: string; created_at: string; seller_id: string | null
  }>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Leads</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: 'var(--text-muted)' }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        <Link href="/dashboard/leads/novo" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Novo lead
        </Link>
      </div>

      <KanbanClient leads={leads} sellers={sellersData} isManager={isManager} />
    </div>
  )
}
