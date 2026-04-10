import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

export default async function ConsorCiadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  const { data } = await supabase
    .from('consorciados')
    .select('id, full_name, cpf, group_number, quota_number, administrator, contemplation_score, next_assembly_date, status, credit_value, installments_paid, total_installments')
    .eq('tenant_id', tenantId)
    .order('contemplation_score', { ascending: false })

  const consorciados = (data || []) as Array<{
    id: string; full_name: string; cpf: string | null; group_number: string | null
    quota_number: string | null; administrator: string | null; contemplation_score: number
    next_assembly_date: string | null; status: string; credit_value: number
    installments_paid: number; total_installments: number | null
  }>

  const STATUS_STYLE: Record<string, React.CSSProperties> = {
    ativo: { backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' },
    contemplado: { backgroundColor: 'rgba(130,100,220,0.15)', color: '#A78BFA' },
    inadimplente: { backgroundColor: 'rgba(255,181,71,0.15)', color: '#FFB547' },
    cancelado: { backgroundColor: 'rgba(255,92,92,0.15)', color: 'var(--danger)' },
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Consorciados</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {consorciados.length} consorciado{consorciados.length !== 1 ? 's' : ''} · ordenado por score
        </p>
      </div>

      <div className="card-pg overflow-hidden">
        {consorciados.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhum consorciado cadastrado.{' '}
              <Link href="/dashboard/importar" style={{ color: 'var(--accent)' }}>Importar planilha →</Link>
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {['Nome', 'CPF', 'Grupo/Cota', 'Administradora', 'Crédito', 'Progresso', 'Próx. Assembleia', 'Score', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consorciados.map((c) => {
                const pct = c.total_installments ? Math.round((c.installments_paid / c.total_installments) * 100) : 0
                const dias = daysUntil(c.next_assembly_date)
                const s: React.CSSProperties = STATUS_STYLE[c.status] || STATUS_STYLE.ativo
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border-color)' }}
                    className="hover:bg-[rgba(0,212,200,0.04)] transition-colors">
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{c.full_name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {c.cpf ? c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {c.group_number || '—'}/{c.quota_number || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.administrator || '—'}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(c.credit_value)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: 'var(--accent)' }} />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.next_assembly_date ? (
                        <span className="text-xs" style={{ color: dias !== null && dias <= 15 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                          {formatDate(c.next_assembly_date)}
                          {dias !== null && ` (${dias}d)`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.contemplation_score >= 70
                        ? <span className="badge-score-high">{c.contemplation_score}</span>
                        : c.contemplation_score >= 40
                        ? <span className="badge-score-mid">{c.contemplation_score}</span>
                        : <span className="badge-score-low">{c.contemplation_score}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize" style={s}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/consorciados/${c.id}`}
                        className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>
                        Ver →
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
