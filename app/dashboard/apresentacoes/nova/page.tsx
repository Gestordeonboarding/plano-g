import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PresentationEditor from '@/components/presentations/PresentationEditor'
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

  const { data: userData } = await supabase.from('users').select('tenant_id, full_name').eq('id', user.id).single()
  const u = userData as { tenant_id: string; full_name: string | null } | null
  if (!u) redirect('/login')

  let template: PresentationTemplate | null = null
  if (templateId) {
    const { data } = await supabase
      .from('presentation_templates').select('*').eq('id', templateId).single()
    template = data as unknown as PresentationTemplate
  }

  if (!template) redirect('/dashboard/apresentacoes')

  return (
    <PresentationEditor
      template={template}
      tenantId={u.tenant_id}
      sellerId={user.id}
      presentationId={null}
      initialPresentation={null}
    />
  )
}
