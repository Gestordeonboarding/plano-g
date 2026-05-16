import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PresentModeClient from './PresentModeClient'
import {
  Slide, FieldValues, PresentationTheme, PresentationTemplate, FieldDef,
} from '@/lib/presentations/types'

export default async function ApresentarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pres } = await supabase
    .from('presentations')
    .select('title, slides, customization, template_id')
    .eq('id', id)
    .single()
  if (!pres) notFound()

  const p = pres as {
    title: string
    slides: unknown
    customization: { field_values?: FieldValues; theme?: PresentationTheme } | null
    template_id: string | null
  }

  // Theme — vem do customization (copiado do template ao criar) ou usa default
  const theme: PresentationTheme =
    p.customization?.theme ?? {
      primary: '#00c4b4',
      background: '#0a1512',
      font: 'Inter',
      style: 'minimal',
    }

  const fieldValues: FieldValues = p.customization?.field_values ?? {}

  // Carrega fields do template pra processar valores (formatação de moeda etc.)
  let fields: FieldDef[] = []
  if (p.template_id) {
    const { data: tpl } = await supabase
      .from('presentation_templates')
      .select('fields')
      .eq('id', p.template_id)
      .single()
    if (tpl) {
      const t = tpl as unknown as PresentationTemplate
      fields = (t.fields ?? []) as FieldDef[]
    }
  }

  return (
    <PresentModeClient
      title={p.title}
      slides={p.slides as Slide[]}
      theme={theme}
      fieldValues={fieldValues}
      fields={fields}
    />
  )
}
