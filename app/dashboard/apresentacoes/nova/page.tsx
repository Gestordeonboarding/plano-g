import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BriefingWizard from '@/components/presentations/BriefingWizard'
import { PresentationTemplate } from '@/lib/presentations/types'

export default async function NovaApresentacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const { template: templateId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!templateId) redirect('/dashboard/apresentacoes')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, full_name, email, phone')
    .eq('id', user.id)
    .single()

  const u = userData as {
    tenant_id: string
    full_name: string | null
    email: string | null
    phone: string | null
  } | null
  if (!u) redirect('/login')

  const { data } = await supabase
    .from('presentation_templates')
    .select('*')
    .eq('id', templateId)
    .single()
  const template = data as unknown as PresentationTemplate
  if (!template) redirect('/dashboard/apresentacoes')

  // Pré-preenche com nome da empresa do tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', u.tenant_id)
    .single()
  const companyName = (tenant as { name: string } | null)?.name || ''

  return (
    <BriefingWizard
      template={template}
      tenantId={u.tenant_id}
      sellerId={user.id}
      defaultSellerName={u.full_name || ''}
      defaultSellerPhone={u.phone || ''}
      defaultCompanyName={companyName}
    />
  )
}
