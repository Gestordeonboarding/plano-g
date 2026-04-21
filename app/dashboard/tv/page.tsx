import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import { createClient as createAdmin } from '@supabase/supabase-js'
import TvClient from './TvClient'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function TvPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = (userData as { role: string } | null)?.role || 'seller'
  const isManager = role !== 'seller'

  const leadsQuery = admin
    .from('leads')
    .select('status')
    .eq('tenant_id', tenantId)

  const { data: leadsData } = role === 'seller'
    ? await leadsQuery.eq('seller_id', user.id)
    : await leadsQuery

  const leads = (leadsData || []) as Array<{ status: string }>

  return <TvClient initialLeads={leads} isManager={isManager} />
}
