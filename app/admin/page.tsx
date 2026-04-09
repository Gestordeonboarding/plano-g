import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'
import { daysSince, formatDate } from '@/lib/utils'

export default async function AdminPage() {
  const supabase = await createClient()

  const [tenantsRes, leadsRes, consorRes] = await Promise.all([
    supabase.from('tenants').select('*'),
    supabase.from('leads').select('id, created_at').gte('created_at', new Date(new Date().setDate(1)).toISOString()),
    supabase.from('consorciados').select('id').eq('status', 'ativo'),
  ])

  const tenants = (tenantsRes.data || []) as Array<{
    id: string; name: string; slug: string; plan: string | null; is_active: boolean;
    last_spreadsheet_import: string | null; created_at: string
  }>
  const leads = leadsRes.data || []
  const consorciados = consorRes.data || []

  const activeTenants = tenants.filter((t) => t.is_active)
  const outdatedTenants = tenants.filter((t) => {
    const days = daysSince(t.last_spreadsheet_import)
    return days === null || days > 7
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Visão Geral
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Painel consolidado de toda a operação
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          icon={<Users size={20} />}
          label="Franqueados ativos"
          value={activeTenants.length}
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          label="Leads este mês"
          value={leads.length}
        />
        <MetricCard
          icon={<Users size={20} />}
          label="Consorciados ativos"
          value={consorciados.length}
        />
      </div>

      {/* Alertas de dados desatualizados */}
      {outdatedTenants.length > 0 && (
        <div className="card-pg p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Franqueados com dados desatualizados
            </h2>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: 'rgba(255,92,92,0.15)', color: 'var(--danger)' }}
            >
              {outdatedTenants.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left pb-2 font-medium">Franqueado</th>
                <th className="text-left pb-2 font-medium">Último import</th>
                <th className="text-left pb-2 font-medium">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {outdatedTenants.slice(0, 5).map((t) => {
                const days = daysSince(t.last_spreadsheet_import)
                return (
                  <tr key={t.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t.name}
                    </td>
                    <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {t.last_spreadsheet_import ? formatDate(t.last_spreadsheet_import) : 'Nunca'}
                    </td>
                    <td className="py-2.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: 'rgba(255,92,92,0.15)', color: 'var(--danger)' }}
                      >
                        {days === null ? 'Sem dados' : `${days}d atrás`}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href={`/admin/franqueados/${t.id}`}
                        style={{ color: 'var(--accent)' }}
                        className="text-xs hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Top franqueados */}
      <div className="card-pg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Todos os franqueados
          </h2>
          <Link
            href="/admin/franqueados"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--accent)' }}
          >
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        {tenants.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhum franqueado cadastrado ainda.{' '}
            <Link href="/admin/franqueados/novo" style={{ color: 'var(--accent)' }}>
              Criar o primeiro →
            </Link>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left pb-2 font-medium">Nome</th>
                <th className="text-left pb-2 font-medium">Slug</th>
                <th className="text-left pb-2 font-medium">Plano</th>
                <th className="text-left pb-2 font-medium">Status</th>
                <th className="text-left pb-2 font-medium">Criado em</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tenants.slice(0, 5).map((t) => (
                <tr key={t.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t.name}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {t.slug}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {t.plan || '—'}
                  </td>
                  <td className="py-2.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={
                        t.is_active
                          ? { backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }
                          : { backgroundColor: 'rgba(255,92,92,0.15)', color: 'var(--danger)' }
                      }
                    >
                      {t.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(t.created_at)}
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      href={`/admin/franqueados/${t.id}`}
                      style={{ color: 'var(--accent)' }}
                      className="text-xs hover:underline"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card-pg p-5 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}
