import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PublicPresentation from './PublicPresentation'
import { Slide, PresentationTheme } from '@/lib/presentations/types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function PublicPresentationPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params

  const { data: pres } = await supabaseAdmin
    .from('presentations')
    .select('id, title, slides, customization, share_expires_at, share_token, seller_id, tenant_id')
    .eq('share_token', shareToken)
    .single()

  if (!pres) notFound()

  const p = pres as {
    id: string; title: string; slides: unknown; customization: unknown
    share_expires_at: string | null; share_token: string; seller_id: string | null; tenant_id: string
  }

  if (p.share_expires_at && new Date(p.share_expires_at) < new Date()) notFound()

  // Buscar tenant para WhatsApp
  const { data: tenant } = await supabaseAdmin
    .from('tenants').select('name, primary_color, evolution_api_url').eq('id', p.tenant_id).single()

  // Buscar telefone do seller
  let sellerPhone: string | null = null
  if (p.seller_id) {
    const { data: seller } = await supabaseAdmin.from('users').select('phone').eq('id', p.seller_id).single()
    sellerPhone = (seller as { phone: string | null } | null)?.phone || null
  }

  const t = tenant as { name: string; primary_color: string | null } | null

  return (
    <PublicPresentation
      shareToken={shareToken}
      title={p.title}
      slides={p.slides as unknown as Slide[]}
      theme={p.customization as unknown as PresentationTheme}
      tenantName={t?.name || 'Consultor'}
      tenantColor={t?.primary_color || '#00D4C8'}
      sellerPhone={sellerPhone}
    />
  )
}
