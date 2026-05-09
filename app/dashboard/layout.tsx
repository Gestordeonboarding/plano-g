import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import MobileNav from '@/components/dashboard/MobileNav'
import RealtimeToast from '@/components/dashboard/RealtimeToast'
import Topbar from '@/components/dashboard/Topbar'
import { daysSince } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cookies } from 'next/headers'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role, full_name, email, tenant_id')
    .eq('id', user.id)
    .single()

  const u = userData as { role: string; full_name: string | null; email: string | null; tenant_id: string | null } | null

  if (!u) redirect('/login')

  // Impersonação: agência visualizando como franqueado
  const cookieStore = await cookies()
  const viewAsTenantId = cookieStore.get('pgViewAs')?.value
  const isViewingAs = u.role === 'agency_admin' && !!viewAsTenantId

  // Role efetivo para controle da sidebar
  const sidebarRole = (isViewingAs ? 'agency_admin' : u.role) as 'seller' | 'tenant_admin' | 'agency_admin'

  const effectiveTenantId = isViewingAs ? viewAsTenantId : u.tenant_id

  // Se não é agency_admin e não tem tenant, bloqueia
  if (!isViewingAs && !u.tenant_id) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, last_spreadsheet_import')
    .eq('id', effectiveTenantId!)
    .single()

  const t = tenant as { id: string; name: string; last_spreadsheet_import: string | null } | null
  const daysSinceImport = daysSince(t?.last_spreadsheet_import)
  const isOutdated = daysSinceImport === null || daysSinceImport > 7

  const alertMessage = isOutdated
    ? daysSinceImport === null
      ? 'Dados ainda não importados — Importar agora'
      : `Dados desatualizados há ${daysSinceImport} dias — Importar`
    : null

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--g-bg-root)' }}>
      {/* Sidebar — visível apenas em telas md+ */}
      <div className="hidden md:block">
        <DashboardSidebar
          tenantName={t?.name || 'Escritório'}
          role={sidebarRole}
          user={{ fullName: u.full_name, email: u.email }}
        />
      </div>

      {/* Bottom nav — visível apenas no mobile */}
      <div className="block md:hidden">
        <MobileNav tenantName={t?.name || 'Escritório'} role={sidebarRole} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Banner de impersonação */}
        {isViewingAs && (
          <div
            className="flex items-center justify-between text-sm font-medium"
            style={{
              backgroundColor: 'var(--g-accent)',
              color: 'var(--g-bg-root)',
              padding: '8px 24px',
            }}
          >
            <span>
              Você está visualizando como: <strong>{t?.name}</strong>
            </span>
            <Link
              href="/admin/view-as/clear"
              className="flex items-center gap-1.5 font-semibold text-xs"
              style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '4px 10px',
                borderRadius: 'var(--g-radius-sm)',
              }}
            >
              <ArrowLeft size={12} /> Voltar ao painel da agência
            </Link>
          </div>
        )}

        {/* Topbar com breadcrumb + chip de alerta discreto */}
        <Topbar alertMessage={alertMessage} />

        {/* Conteúdo principal — padding 28/32 padrão do design system */}
        <main
          className="flex-1 pb-20 md:pb-7"
          style={{ padding: '28px 32px' }}
        >
          {children}
        </main>
      </div>

      <RealtimeToast userId={user.id} />
    </div>
  )
}
