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

  const [{ data: sellers }, { data: leads }] = await Promise.all([
    admin.from('users').select('id, full_name, email').eq('tenant_id', tenantId),
    admin.from('leads').select('seller_id, status').eq('tenant_id', tenantId),
  ])

  const allLeads = (leads || []) as Array<{ seller_id: string | null; status: string }>
  const allSellers = (sellers || []) as Array<{ id: string; full_name: string | null; email: string | null }>

  const ranking = allSellers.map((s) => {
    const myLeads = allLeads.filter((l) => l.seller_id === s.id)
    const converted = myLeads.filter((l) => l.status === 'convertido').length
    const proposta = myLeads.filter((l) => l.status === 'proposta_enviada').length
    const documentacao = myLeads.filter((l) => l.status === 'documentacao').length
    const total = myLeads.length
    const score = converted * 10 + documentacao * 4 + proposta * 2 + (total - converted - documentacao - proposta)
    return { id: s.id, name: s.full_name || s.email || 'Vendedor', converted, proposta, documentacao, total, score }
  })
  .sort((a, b) => b.score - a.score || b.converted - a.converted)

  return <TvClient initialRanking={ranking} />
}
