import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PortalBottomNav from '@/components/portal/BottomNav'
import { Logo } from '@/components/ui/Logo'

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, logo_url, primary_color, is_active')
    .eq('slug', slug)
    .single()

  if (!tenant || !(tenant as { is_active: boolean }).is_active) notFound()

  const t = tenant as { id: string; name: string; logo_url: string | null; primary_color: string | null }
  const primaryColor = t.primary_color || '#00D4C8'

  return (
    <div
      className="min-h-screen flex flex-col max-w-md mx-auto relative"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* CSS variable dinâmica do tenant */}
      <style>{`:root { --tenant-primary: ${primaryColor}; }`}</style>

      {/* Header — Logo + nome do tenant (logo do tenant tem prioridade se existir) */}
      <header
        className="h-14 shrink-0 border-b flex items-center"
        style={{
          backgroundColor: 'var(--g-bg-surface)',
          borderColor: 'var(--g-border)',
          padding: '14px 20px',
          gap: 10,
        }}
      >
        {t.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.logo_url} alt={t.name} className="h-8 object-contain" />
        ) : (
          <>
            <Logo size={26} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--g-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {t.name}
            </span>
          </>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 py-5">{children}</main>

      {/* Bottom nav */}
      <PortalBottomNav slug={slug} />
    </div>
  )
}
