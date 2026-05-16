import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PublicPresentation from './PublicPresentation'
import {
  Slide, FieldValues, PresentationTheme, PresentationTemplate, FieldDef,
} from '@/lib/presentations/types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

export default async function PublicPresentationPage({
  params,
}: {
  params: Promise<{ shareToken: string }>
}) {
  const { shareToken } = await params

  const { data: pres } = await supabaseAdmin
    .from('presentations')
    .select(
      'id, title, slides, customization, share_expires_at, share_token, seller_id, tenant_id, template_id',
    )
    .eq('share_token', shareToken)
    .single()

  if (!pres) notFound()

  const p = pres as {
    id: string
    title: string
    slides: unknown
    customization: { field_values?: FieldValues; theme?: PresentationTheme } | null
    share_expires_at: string | null
    share_token: string
    seller_id: string | null
    tenant_id: string
    template_id: string | null
  }

  if (p.share_expires_at && new Date(p.share_expires_at) < new Date()) notFound()

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('name')
    .eq('id', p.tenant_id)
    .single()

  let sellerPhone: string | null = null
  if (p.seller_id) {
    const { data: seller } = await supabaseAdmin
      .from('users')
      .select('phone')
      .eq('id', p.seller_id)
      .single()
    sellerPhone = (seller as { phone: string | null } | null)?.phone || null
  }

  const t = tenant as { name: string } | null

  const theme: PresentationTheme =
    p.customization?.theme ?? {
      primary: '#00c4b4',
      background: '#0a1512',
      font: 'Inter',
      style: 'minimal',
    }
  const fieldValues: FieldValues = p.customization?.field_values ?? {}

  let fields: FieldDef[] = []
  if (p.template_id) {
    const { data: tpl } = await supabaseAdmin
      .from('presentation_templates')
      .select('fields')
      .eq('id', p.template_id)
      .single()
    if (tpl) {
      const tplData = tpl as unknown as PresentationTemplate
      fields = (tplData.fields ?? []) as FieldDef[]
    }
  }

  return (
    <PublicPresentation
      shareToken={shareToken}
      title={p.title}
      slides={p.slides as Slide[]}
      theme={theme}
      fieldValues={fieldValues}
      fields={fields}
      tenantName={t?.name || 'Consultor'}
      sellerPhone={sellerPhone}
    />
  )
}
