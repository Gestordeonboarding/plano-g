import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Phone, TrendingUp, X, Trophy } from 'lucide-react'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import {
  OUTCOME_LABELS, OUTCOME_EMOJI, OUTCOME_COLORS,
  CONVERSION_OUTCOMES, SUCCESSFUL_OUTCOMES,
} from '@/lib/calls'
import type { CallLog } from '@/types/database'
import Filters from './Filters'

interface SearchParams {
  period?: string
  seller?: string
  start?: string
  end?: string
}

export default async function RelatorioLigacoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const period = sp.period || 'mes'
  const seller = sp.seller || 'all'

  const auth = await createClient()
  const db = await createServiceClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  // Acesso restrito a admins
  const { data: me } = await db
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = (me as { role: string } | null)?.role
  if (role !== 'tenant_admin' && role !== 'agency_admin') redirect('/dashboard')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/dashboard')

  // ── Cálculo do range ─────────────────────────────────────────
  const now = new Date()
  let startDate: Date
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  if (period === 'hoje') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  } else if (period === 'semana') {
    startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)
  } else if (period === 'custom') {
    startDate = sp.start ? new Date(`${sp.start}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = sp.end ? new Date(`${sp.end}T23:59:59`) : endDate
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  // ── Buscas ────────────────────────────────────────────────────
  let callsQuery = db
    .from('call_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('called_at', startDate.toISOString())
    .lte('called_at', endDate.toISOString())
    .order('called_at', { ascending: false })

  if (seller !== 'all') callsQuery = callsQuery.eq('seller_id', seller)

  const [callsRes, sellersRes] = await Promise.all([
    callsQuery,
    db.from('users').select('id, full_name, email')
      .eq('tenant_id', tenantId)
      .in('role', ['seller', 'tenant_admin']),
  ])

  const calls = (callsRes.data || []) as CallLog[]
  const allSellers = (sellersRes.data || []) as Array<{
    id: string; full_name: string | null; email: string | null
  }>
  const sellerOptions = allSellers.map((s) => ({
    id: s.id,
    name: s.full_name || s.email || 'Vendedor',
  }))
  const sellerNameById = (id: string) =>
    sellerOptions.find((s) => s.id === id)?.name || '—'

  // ── KPIs ─────────────────────────────────────────────────────
  const total = calls.length
  const answered = calls.filter((c) => SUCCESSFUL_OUTCOMES.includes(c.outcome)).length
  const notAnswered = total - answered
  const conversions = calls.filter((c) => CONVERSION_OUTCOMES.includes(c.outcome)).length
  const conversionRate = answered > 0 ? Math.round((conversions / answered) * 100) : 0

  // ── Ranking por vendedor ─────────────────────────────────────
  const ranking = sellerOptions.map((s) => {
    const myCalls = calls.filter((c) => c.seller_id === s.id)
    const att = myCalls.filter((c) => SUCCESSFUL_OUTCOMES.includes(c.outcome)).length
    const naoAtt = myCalls.length - att
    const agendou = myCalls.filter((c) => c.outcome === 'agendou_reuniao').length
    const vendas = myCalls.filter((c) => c.outcome === 'venda_realizada').length
    const conv = myCalls.filter((c) => CONVERSION_OUTCOMES.includes(c.outcome)).length
    const taxa = myCalls.length > 0 ? (conv / myCalls.length) * 100 : 0
    return {
      ...s,
      total: myCalls.length,
      att, naoAtt, agendou, vendas, taxa,
    }
  })
  .filter((r) => r.total > 0)
  .sort((a, b) => b.total - a.total)

  // ── Ligações por dia (gráfico) ───────────────────────────────
  // Construir buckets de dia entre startDate e endDate
  const days: Array<{ date: string; label: string; total: number; bySeller: Record<string, number> }> = []
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const endCursor = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  while (cursor <= endCursor) {
    const iso = cursor.toISOString().split('T')[0]
    days.push({
      date: iso,
      label: cursor.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: 0,
      bySeller: {},
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  calls.forEach((c) => {
    const day = c.called_at.split('T')[0]
    const bucket = days.find((d) => d.date === day)
    if (bucket) {
      bucket.total++
      bucket.bySeller[c.seller_id] = (bucket.bySeller[c.seller_id] || 0) + 1
    }
  })

  const maxDay = Math.max(...days.map((d) => d.total), 1)
  // Limita a exibição a até 30 dias para o gráfico não ficar ilegível
  const chartDays = days.length > 30 ? days.slice(-30) : days

  // ── Lista de ligações recentes (até 50) ──────────────────────
  const recent = calls.slice(0, 50)

  // ── Render ───────────────────────────────────────────────────
  const periodLabel = (() => {
    if (period === 'hoje') return 'Hoje'
    if (period === 'semana') return 'Últimos 7 dias'
    if (period === 'custom') {
      return `${startDate.toLocaleDateString('pt-BR')} → ${endDate.toLocaleDateString('pt-BR')}`
    }
    return 'Este mês'
  })()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(0,212,200,0.15)' }}
          >
            <Phone size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Relatório de Ligações
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {periodLabel}
              {seller !== 'all' && <> · {sellerNameById(seller)}</>}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Filters
        period={period}
        seller={seller}
        start={sp.start || ''}
        end={sp.end || ''}
        sellers={sellerOptions}
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi
          icon={<Phone size={17} />}
          label="Total de ligações"
          value={total}
          color="var(--accent)"
          bg="rgba(0,212,200,0.12)"
        />
        <Kpi
          icon={<span style={{ fontSize: 16 }}>✅</span>}
          label="Atendidas"
          value={answered}
          sub={total > 0 ? `${Math.round((answered / total) * 100)}% do total` : '—'}
          color="#25D366"
          bg="rgba(37,211,102,0.12)"
        />
        <Kpi
          icon={<X size={17} />}
          label="Não atendidas"
          value={notAnswered}
          sub={total > 0 ? `${Math.round((notAnswered / total) * 100)}% do total` : '—'}
          color="#FF5C5C"
          bg="rgba(255,92,92,0.12)"
        />
        <Kpi
          icon={<TrendingUp size={17} />}
          label="Conversões"
          value={conversions}
          sub={`${conversionRate}% das atendidas`}
          color="#A78BFA"
          bg="rgba(167,139,250,0.12)"
        />
      </div>

      {/* Ranking */}
      <div className="card-pg overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2"
          style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Trophy size={15} style={{ color: '#FFB547' }} />
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Ranking por vendedor
          </p>
        </div>
        {ranking.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            Nenhuma ligação registrada no período.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {['#', 'Vendedor', 'Ligações', 'Atendidas', 'Não atendeu', 'Agendou', 'Vendas', 'Taxa conv.'].map((h) => (
                  <th key={h}
                    className="text-left px-4 py-2.5 text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold"
                      style={{ color: i === 0 ? '#FFB547' : 'var(--text-muted)' }}>
                      {i + 1}º
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {r.name}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.total}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.att}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{r.naoAtt}</td>
                  <td className="px-4 py-3" style={{ color: '#A78BFA' }}>{r.agendou}</td>
                  <td className="px-4 py-3" style={{ color: '#00D4C8', fontWeight: 600 }}>{r.vendas}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: r.taxa >= 15 ? 'rgba(0,212,200,0.15)' : 'var(--bg-tertiary)',
                        color: r.taxa >= 15 ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      {r.taxa.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Gráfico por dia */}
      <div className="card-pg p-5">
        <p className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
          Volume diário de ligações
        </p>
        {chartDays.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sem dados.</p>
        ) : (
          <div className="flex items-end gap-1.5" style={{ height: 160 }}>
            {chartDays.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {d.total > 0 ? d.total : ''}
                </span>
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max(2, (d.total / maxDay) * 130)}px`,
                    backgroundColor: d.total > 0 ? 'var(--accent)' : 'var(--bg-tertiary)',
                  }}
                  title={`${d.label}: ${d.total} ligações`}
                />
                <span className="text-[9px] truncate w-full text-center"
                  style={{ color: 'var(--text-muted)' }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista recente */}
      <div className="card-pg overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-color)' }}>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Ligações recentes
          </p>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Mostrando {recent.length} de {total}
          </span>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            Nenhuma ligação no período.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {['Data', 'Vendedor', 'Contato', 'Resultado', 'Duração', 'Anotação', 'Retorno'].map((h) => (
                  <th key={h}
                    className="text-left px-4 py-2.5 text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((c) => {
                const colors = OUTCOME_COLORS[c.outcome]
                const truncated = c.notes && c.notes.length > 60
                  ? c.notes.slice(0, 60) + '…'
                  : c.notes || ''
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3 text-xs whitespace-nowrap"
                      style={{ color: 'var(--text-secondary)' }}>
                      {new Date(c.called_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {sellerNameById(c.seller_id)}
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ color: 'var(--text-primary)' }}>{c.contact_name}</div>
                      {c.contact_phone && (
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {c.contact_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[11px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-1"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          fontWeight: colors.bold ? 800 : 700,
                        }}
                      >
                        <span>{OUTCOME_EMOJI[c.outcome]}</span>
                        {OUTCOME_LABELS[c.outcome]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {c.duration_minutes != null ? `${c.duration_minutes}min` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[260px]"
                      style={{ color: 'var(--text-secondary)' }} title={c.notes || ''}>
                      {truncated || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.scheduled_callback_at ? (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            backgroundColor: 'rgba(167,139,250,0.12)',
                            color: '#A78BFA',
                            fontWeight: 600,
                          }}
                        >
                          {new Date(c.scheduled_callback_at).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
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

function Kpi({
  icon, label, value, sub, color, bg,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  color: string
  bg: string
}) {
  return (
    <div className="card-pg p-4 flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: bg, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {sub && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        )}
      </div>
    </div>
  )
}
