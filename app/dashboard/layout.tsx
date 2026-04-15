import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import { daysSince } from '@/lib/utils'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
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

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <DashboardSidebar tenantName={t?.name || 'Escritório'} role={sidebarRole} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Banner de impersonação */}
        {isViewingAs && (
          <div
            className="flex items-center justify-between px-6 py-2.5 text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            <span>
              Você está visualizando como: <strong>{t?.name}</strong>
            </span>
            <Link
              href="/admin/view-as/clear"
              className="flex items-center gap-1.5 px-3 py-1 rounded font-semibold text-xs"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
            >
              <ArrowLeft size={12} /> Voltar ao painel da agência
            </Link>
          </div>
        )}

        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-6 border-b shrink-0"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {u.full_name || u.email}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isViewingAs ? 'Agência (modo visualização)' : u.role === 'tenant_admin' ? 'Administrador' : 'Vendedor'}
              </p>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              {(u.full_name || u.email || 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Banner de dados desatualizados */}
        {isOutdated && (
          <div className="alert-outdated flex items-center gap-3 px-6 py-3">
            <AlertTriangle size={16} />
            <span className="text-sm">
              {daysSinceImport === null
                ? 'Dados ainda não importados.'
                : `Dados desatualizados há ${daysSinceImport} dias.`}{' '}
              <Link href="/dashboard/importar" className="font-semibold underline">
                Importar agora →
              </Link>
            </span>
          </div>
        )}

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
