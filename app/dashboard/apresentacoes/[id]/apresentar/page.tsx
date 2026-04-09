import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PresentModeClient from './PresentModeClient'
import { Slide, PresentationTheme } from '@/lib/presentations/types'

export default async function ApresentarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pres } = await supabase.from('presentations').select('title, slides, customization').eq('id', id).single()
  if (!pres) notFound()

  const p = pres as { title: string; slides: unknown; customization: unknown }

  return (
    <PresentModeClient
      title={p.title}
      slides={p.slides as unknown as Slide[]}
      theme={p.customization as unknown as PresentationTheme}
    />
  )
}
