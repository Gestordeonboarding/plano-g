import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PresentationEditor from '@/components/presentations/PresentationEditor'
import { PresentationTemplate, Presentation } from '@/lib/presentations/types'

export default async function EditarApresentacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
  const u = userData as { tenant_id: string } | null
  if (!u) redirect('/login')

  const { data: pres } = await supabase.from('presentations').select('*').eq('id', id).single()
  if (!pres) notFound()

  const presentation = pres as unknown as Presentation

  let template: PresentationTemplate | null = null
  if (presentation.template_id) {
    const { data } = await supabase
      .from('presentation_templates').select('*').eq('id', presentation.template_id).single()
    template = data as unknown as PresentationTemplate
  }

  return (
    <PresentationEditor
      template={template}
      tenantId={u.tenant_id}
      sellerId={user.id}
      presentationId={id}
      initialPresentation={presentation}
    />
  )
}
