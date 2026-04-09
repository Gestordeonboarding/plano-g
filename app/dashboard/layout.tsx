import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import { daysSince } from '@/lib/utils'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

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

  if (!u) {
    redirect('/login')
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, last_spreadsheet_import')
    .eq('id', u.tenant_id!)
    .single()

  const t = tenant as { id: string; name: string; last_spreadsheet_import: string | null } | null
  const daysSinceImport = daysSince(t?.last_spreadsheet_import)
  const isOutdated = daysSinceImport === null || daysSinceImport > 7

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <DashboardSidebar tenantName={t?.name || 'Meu Escritório'} />

      <div className="flex-1 flex flex-col min-w-0">
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
                {u.role === 'tenant_admin' ? 'Administrador' : 'Vendedor'}
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
                ? 'Seus dados ainda não foram importados.'
                : `Seus dados estão desatualizados há ${daysSinceImport} dias.`}{' '}
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
