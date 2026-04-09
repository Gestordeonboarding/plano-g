import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate, daysSince } from '@/lib/utils'

export default async function FranqueadosPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  const tenants = (data || []) as Array<{
    id: string; name: string; slug: string; plan: string | null
    is_active: boolean; created_at: string; last_spreadsheet_import: string | null
  }>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Franqueados
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {tenants.length} franqueado{tenants.length !== 1 ? 's' : ''} cadastrado{tenants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/franqueados/novo"
          className="flex items-center gap-2 btn-primary text-sm"
        >
          <Plus size={16} />
          Novo franqueado
        </Link>
      </div>

      <div className="card-pg overflow-hidden">
        {tenants.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhum franqueado cadastrado ainda.
            </p>
            <Link href="/admin/franqueados/novo" className="btn-primary inline-block mt-4 text-sm">
              Criar primeiro franqueado
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {['Nome', 'Slug', 'Plano', 'Status', 'Último import', 'Criado em', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const days = daysSince(t.last_spreadsheet_import)
                const outdated = days === null || days > 7
                return (
                  <tr
                    key={t.id}
                    style={{ borderTop: '1px solid var(--border-color)' }}
                    className="hover:bg-[rgba(0,212,200,0.04)] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t.name}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {t.slug}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {t.plan || '—'}
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
                      {outdated ? (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: 'rgba(255,92,92,0.15)', color: 'var(--danger)' }}
                        >
                          {days === null ? 'Nunca' : `${days}d atrás`}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {formatDate(t.last_spreadsheet_import)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(t.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/franqueados/${t.id}`}
                        className="text-xs font-medium hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        Editar →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
