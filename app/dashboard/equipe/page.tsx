import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import EquipeAdminClient from './EquipeAdminClient'
import NovoVendedorForm from './NovoVendedorForm'

export default async function EquipePage() {
  const authClient = await createClient()
  const db = await createServiceClient()

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/dashboard')

  const { data: userData } = await db.from('users').select('role').eq('id', user.id).single()
  const role = (userData as { role: string } | null)?.role
  if (role === 'seller') redirect('/dashboard')

  const currentMonth = new Date().toISOString().slice(0, 7)
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [sellersRes, leadsRes, commissionsRes, prizesRes] = await Promise.all([
    db.from('users')
      .select('id, full_name, email, avatar_url, is_active, created_at, whatsapp_phone')
      .eq('tenant_id', tenantId)
      .eq('role', 'seller')
      .order('created_at'),
    db.from('leads')
      .select('seller_id, desired_credit')
      .eq('tenant_id', tenantId)
      .eq('status', 'convertido')
      .gte('created_at', firstOfMonth),
    db.from('seller_commissions').select('*').eq('tenant_id', tenantId),
    db.from('seller_prizes').select('*').eq('tenant_id', tenantId).eq('month', currentMonth),
  ])

  return (
    <div className="flex flex-col gap-6">
      <EquipeAdminClient
        tenantId={tenantId}
        sellers={(sellersRes.data || []) as any[]}
        monthLeads={(leadsRes.data || []) as any[]}
        commissions={(commissionsRes.data || []) as any[]}
        prizes={(prizesRes.data || []) as any[]}
        currentMonth={currentMonth}
      />
      <div className="card-pg p-5">
        <p className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Adicionar novo vendedor</p>
        <NovoVendedorForm tenantId={tenantId} />
      </div>
    </div>
  )
}
