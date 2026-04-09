import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import SimuladorClient from './SimuladorClient'

export default async function SimuladorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/portal/${slug}/login`)

  const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) redirect(`/portal/${slug}/login`)

  const { data: con } = await supabase
    .from('consorciados')
    .select('id, credit_value, group_number, installments_paid, monthly_installment, contemplation_score')
    .eq('user_id', user.id)
    .eq('tenant_id', (tenant as { id: string }).id)
    .single()

  if (!con) redirect(`/portal/${slug}`)

  const c = con as {
    id: string; credit_value: number; group_number: string | null
    installments_paid: number; monthly_installment: number | null; contemplation_score: number
  }

  // Buscar histórico de assembleias do grupo
  const { data: assemblies } = await supabase
    .from('assemblies')
    .select('assembly_date, winning_bid_percentage, winning_bid_amount, was_contemplated, draw_contemplated')
    .eq('group_number', c.group_number || '')
    .order('assembly_date', { ascending: false })
    .limit(6)

  const history = (assemblies || []) as Array<{
    assembly_date: string
    winning_bid_percentage: number | null
    winning_bid_amount: number | null
    was_contemplated: boolean
    draw_contemplated: boolean
  }>

  // Saldo estimado do consorciado (parcelas pagas * parcela * 30%)
  const estimatedBalance = (c.installments_paid || 0) * (c.monthly_installment || 0) * 0.3

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Simulador de Lance</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Simule suas chances na próxima assembleia
        </p>
      </div>

      <SimuladorClient
        creditValue={c.credit_value}
        estimatedBalance={estimatedBalance}
        history={history}
      />

      {/* Histórico de assembleias */}
      {history.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Últimas assembleias do grupo
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                {['Data', 'Menor lance', 'Contemplação'].map((h) => (
                  <th key={h} className="text-left pb-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((a, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(a.assembly_date)}
                  </td>
                  <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
                    {a.winning_bid_percentage != null
                      ? `${a.winning_bid_percentage}%`
                      : a.winning_bid_amount != null
                      ? formatCurrency(a.winning_bid_amount)
                      : '—'}
                  </td>
                  <td className="py-2">
                    {a.was_contemplated
                      ? <span style={{ color: 'var(--accent)' }}>Lance ✓</span>
                      : a.draw_contemplated
                      ? <span style={{ color: '#A78BFA' }}>Sorteio ✓</span>
                      : <span style={{ color: 'var(--text-muted)' }}>Não</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {history.length === 0 && (
        <div className="rounded-2xl p-5 text-center"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhum histórico de assembleia disponível para este grupo ainda.
          </p>
        </div>
      )}
    </div>
  )
}
