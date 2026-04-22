import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import AdmClient, { type TAdm } from './AdmClient'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function AdministradorasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  const [{ data: allAdm }, { data: tenantAdm }, { data: allCartas }] = await Promise.all([
    admin.from('administradoras').select('id, nome, slug, cor').order('nome'),
    admin.from('tenant_administradoras').select(`
      id, taxa_administracao, fundo_reserva, comissao_venda, comissao_lance, ativa,
      administradora:administradora_id ( id, nome, slug, cor )
    `).eq('tenant_id', tenantId).order('created_at'),
    admin.from('cartas').select('*').eq('tenant_id', tenantId).order('tipo').order('valor_credito'),
  ])

  return (
    <AdmClient
      allAdministradoras={allAdm ?? []}
      initialTenantAdm={(tenantAdm ?? []) as unknown as TAdm[]}
      initialCartas={allCartas ?? []}
    />
  )
}
