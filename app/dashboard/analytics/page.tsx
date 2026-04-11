import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Trophy, Clock, AlertTriangle, TrendingUp, Target, BarChart3 } from 'lucide-react'
import { AddSellerButton, AddLeadButton, AddConsorciadoButton } from '@/components/analytics/AnalyticsActions'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/* ─── Micro chart components ──────────────────────────────────────── */

function DonutChart({ segments, size = 110 }: { segments: { pct: number; color: string }[]; size?: number }) {
  const valid = segments.filter((s) => s.pct > 0)
  if (valid.length === 0)
    return <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)' }} />
  let acc = 0
  const gradient = valid.map((s) => { const v = `${s.color} ${acc}% ${acc + s.pct}%`; acc += s.pct; return v }).join(', ')
  const hole = Math.round(size * 0.3)
  return (
    <div className="relative flex-shrink-0 rounded-full" style={{ width: size, height: size, background: `conic-gradient(${gradient})` }}>
      <div className="absolute rounded-full" style={{ top: hole, right: hole, bottom: hole, left: hole, backgroundColor: 'var(--bg-secondary)' }} />
    </div>
  )
}

function BarChart({ data, height = 120 }: { data: { label: string; value: number; converted?: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          {d.value > 0 && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.value}</span>}
          <div className="w-full rounded-t relative overflow-hidden" style={{ height: `${Math.max(4, (d.value / max) * (height - 28))}px`, backgroundColor: 'rgba(0,212,200,0.18)' }}>
            {d.converted !== undefined && d.value > 0 && (
              <div className="absolute bottom-0 left-0 right-0 rounded-t" style={{ height: `${(d.converted / d.value) * 100}%`, backgroundColor: 'var(--accent)' }} />
            )}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function Bar({ value, max, color = 'var(--accent)', h = 8 }: { value: number; max: number; color?: string; h?: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="rounded-full overflow-hidden" style={{ height: h, backgroundColor: 'var(--bg-tertiary)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function Kpi({ label, value, sub, color, emoji }: { label: string; value: string | number; sub: string; color: string; emoji: string }) {
  return (
    <div className="card-pg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-2xl">{emoji}</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium leading-tight text-right max-w-[120px]"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold leading-tight" style={{ color }}>{value}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
  const role = (me as { role: string } | null)?.role

  // Sellers don't have access to analytics
  if (role === 'seller') redirect('/dashboard')

  // getViewingTenantId handles both impersonation (agency_admin) and normal tenant users
  const tenantId = await getViewingTenantId()

  // If no tenant: agency_admin without impersonation → admin analytics; others → dashboard
  if (!tenantId) {
    if (role === 'agency_admin') redirect('/admin/analytics')
    redirect('/dashboard')
  }

  const { period = 'month' } = await searchParams
  const now = new Date()

  let startDate: Date
  let periodLabel: string
  switch (period) {
    case 'quarter': startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1); periodLabel = 'Últimos 3 meses'; break
    case 'year': startDate = new Date(now.getFullYear(), 0, 1); periodLabel = 'Este ano'; break
    default: startDate = new Date(now.getFullYear(), now.getMonth(), 1); periodLabel = 'Este mês'
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000)

  const [leadsRes, allLeadsRes, consRes, usersRes, tenantRes] = await Promise.all([
    supabaseAdmin.from('leads').select('id, status, created_at, seller_id, asset_type, source, qualification_score, desired_credit').eq('tenant_id', tenantId).gte('created_at', startDate.toISOString()),
    supabaseAdmin.from('leads').select('id, status, created_at, seller_id').eq('tenant_id', tenantId).gte('created_at', sixMonthsAgo.toISOString()),
    supabaseAdmin.from('consorciados').select('id, status, credit_value, administrator, next_assembly_date, contemplation_score, installments_paid, total_installments').eq('tenant_id', tenantId),
    supabaseAdmin.from('users').select('id, full_name, email').eq('tenant_id', tenantId),
    supabaseAdmin.from('tenants').select('name, plan').eq('id', tenantId).single(),
  ])

  type Lead = { id: string; status: string; created_at: string; seller_id: string | null; asset_type: string | null; source: string; qualification_score: number; desired_credit: number | null }
  type Cons = { id: string; status: string; credit_value: number; administrator: string | null; next_assembly_date: string | null; contemplation_score: number; installments_paid: number; total_installments: number | null }
  type Seller = { id: string; full_name: string | null; email: string | null }

  const leads = (leadsRes.data || []) as Lead[]
  const allLeads = (allLeadsRes.data || []) as { id: string; status: string; created_at: string; seller_id: string | null }[]
  const cons = (consRes.data || []) as Cons[]
  const sellers = (usersRes.data || []) as Seller[]
  const tenant = tenantRes.data as { name: string; plan: string | null } | null

  /* ── Metrics ── */
  const totalLeads = leads.length
  const convertidos = leads.filter((l) => l.status === 'convertido').length
  const perdidos = leads.filter((l) => l.status === 'perdido').length
  const taxa = totalLeads > 0 ? (convertidos / totalLeads) * 100 : 0

  const ativos = cons.filter((c) => c.status === 'ativo')
  const contemplados = cons.filter((c) => c.status === 'contemplado').length
  const inadimplentes = cons.filter((c) => c.status === 'inadimplente').length
  const cancelados = cons.filter((c) => c.status === 'cancelado').length
  const totalCons = cons.length

  const ticketMedio = ativos.length > 0 ? ativos.reduce((s, c) => s + (c.credit_value || 0), 0) / ativos.length : 0
  const vgvTotal = ativos.reduce((s, c) => s + (c.credit_value || 0), 0)

  const convLeads = leads.filter((l) => l.status === 'convertido')
  const tempoMedio = convLeads.length > 0
    ? Math.round(convLeads.reduce((s, l) => s + Math.floor((now.getTime() - new Date(l.created_at).getTime()) / 86400000), 0) / convLeads.length)
    : null

  /* Volume by month */
  const volumeByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const ml = allLeads.filter((l) => { const dt = new Date(l.created_at); return dt >= d && dt < next })
    return { label: d.toLocaleDateString('pt-BR', { month: 'short' }), value: ml.length, converted: ml.filter((l) => l.status === 'convertido').length }
  })

  /* Funil */
  const statusOrder = ['novo', 'contato_feito', 'proposta_enviada', 'documentacao', 'convertido', 'perdido']
  const statusLabels: Record<string, string> = { novo: 'Novo', contato_feito: 'Contato feito', proposta_enviada: 'Proposta enviada', documentacao: 'Documentação', convertido: 'Convertido', perdido: 'Perdido' }
  const funnelData = statusOrder.map((status) => {
    const sl = leads.filter((l) => l.status === status)
    const avgDays = sl.length > 0 ? Math.round(sl.reduce((s, l) => s + Math.floor((now.getTime() - new Date(l.created_at).getTime()) / 86400000), 0) / sl.length) : 0
    return { status, label: statusLabels[status], count: sl.length, avgDays }
  })

  /* Aging alerts */
  const agingAlerts = statusOrder.slice(0, 4).map((status) => {
    const stale = leads.filter((l) => l.status === status && Math.floor((now.getTime() - new Date(l.created_at).getTime()) / 86400000) > 5)
    return { status, label: statusLabels[status], count: stale.length }
  }).filter((a) => a.count > 0)

  /* Seller ranking */
  const sellerRanking = sellers.map((s) => {
    const sl = leads.filter((l) => l.seller_id === s.id)
    const sc = sl.filter((l) => l.status === 'convertido').length
    return { id: s.id, name: s.full_name || s.email || '—', leads: sl.length, convertidos: sc, taxa: sl.length > 0 ? (sc / sl.length) * 100 : 0 }
  }).sort((a, b) => b.convertidos - a.convertidos)
  const maxLeads = Math.max(...sellerRanking.map((s) => s.leads), 1)

  /* Mix produtos */
  const assetColors: Record<string, string> = { imovel: '#00D4C8', auto: '#A78BFA', moto: '#60A5FA', servicos: '#FFB547', outros: '#FF5C5C' }
  const assetLabels: Record<string, string> = { imovel: 'Imóvel', auto: 'Auto', moto: 'Moto', servicos: 'Serviços', outros: 'Outros' }
  const assetMap: Record<string, number> = {}
  leads.forEach((l) => { const k = l.asset_type || 'outros'; assetMap[k] = (assetMap[k] || 0) + 1 })
  const mixProdutos = Object.entries(assetMap).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ key: k, label: assetLabels[k] || k, count: n, pct: totalLeads > 0 ? (n / totalLeads) * 100 : 0, color: assetColors[k] || '#888' }))

  /* Mix administradoras */
  const adminMap: Record<string, { count: number; vgv: number }> = {}
  ativos.forEach((c) => { const k = c.administrator || 'Não informado'; if (!adminMap[k]) adminMap[k] = { count: 0, vgv: 0 }; adminMap[k].count++; adminMap[k].vgv += c.credit_value || 0 })
  const mixAdmin = Object.entries(adminMap).sort((a, b) => b[1].vgv - a[1].vgv).slice(0, 6)
  const maxVgv = Math.max(...mixAdmin.map(([, d]) => d.vgv), 1)

  /* Assembleias */
  const assembleias = cons.filter((c) => c.next_assembly_date && new Date(c.next_assembly_date) <= thirtyDaysFromNow && new Date(c.next_assembly_date) >= now)
    .sort((a, b) => new Date(a.next_assembly_date!).getTime() - new Date(b.next_assembly_date!).getTime())
  const asmByDate: Record<string, { date: string; count: number; admins: Set<string> }> = {}
  assembleias.forEach((c) => {
    const d = c.next_assembly_date!
    if (!asmByDate[d]) asmByDate[d] = { date: d, count: 0, admins: new Set() }
    asmByDate[d].count++
    if (c.administrator) asmByDate[d].admins.add(c.administrator)
  })
  const asmList = Object.values(asmByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  /* Contemplação donut segments */
  const consDonut = [
    { pct: totalCons > 0 ? (ativos.length / totalCons) * 100 : 0, color: 'var(--accent)' },
    { pct: totalCons > 0 ? (contemplados / totalCons) * 100 : 0, color: '#A78BFA' },
    { pct: totalCons > 0 ? (inadimplentes / totalCons) * 100 : 0, color: '#FFB547' },
    { pct: totalCons > 0 ? (cancelados / totalCons) * 100 : 0, color: '#FF5C5C' },
  ]

  const funnelColors = ['#00D4C8', '#60A5FA', '#A78BFA', '#FFB547', '#25D366', '#FF5C5C']
  const adminColors = ['var(--accent)', '#A78BFA', '#60A5FA', '#FFB547', '#25D366', '#FF8C42']

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {tenant?.name} · Inteligência de vendas · {periodLabel}
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {[{ v: 'month', l: 'Mês' }, { v: 'quarter', l: 'Trimestre' }, { v: 'year', l: 'Ano' }].map((o) => (
            <Link key={o.v} href={`?period=${o.v}`}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
              style={period === o.v ? { backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' } : { color: 'var(--text-secondary)' }}>
              {o.l}
            </Link>
          ))}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi emoji="📊" label="Volume de Leads" value={totalLeads} sub={`${perdidos} perdidos no período`} color="var(--accent)" />
        <Kpi emoji="🎯" label="Taxa de Conversão"
          value={`${taxa.toFixed(1)}%`}
          sub={`${convertidos} de ${totalLeads} leads convertidos`}
          color={taxa >= 20 ? '#25D366' : taxa >= 10 ? '#FFB547' : 'var(--danger)'} />
        <Kpi emoji="💰" label="Ticket Médio / Cota"
          value={ticketMedio > 0 ? formatCurrency(ticketMedio) : '—'}
          sub={`VGV ativo: ${formatCurrency(vgvTotal)}`}
          color="#A78BFA" />
        <Kpi emoji="⏱️" label="Tempo Médio Fechamento"
          value={tempoMedio !== null ? `${tempoMedio} dias` : '—'}
          sub="desde primeiro contato até conversão"
          color="#60A5FA" />
      </div>

      {/* ── Volume + Mix de Produtos ── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Bar chart */}
        <div className="card-pg p-5 col-span-2 flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Volume de Leads</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Últimos 6 meses — barra clara = total · barra escura = convertidos
            </p>
          </div>
          <BarChart data={volumeByMonth} height={130} />
          <div className="flex items-center gap-4 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: 'rgba(0,212,200,0.18)' }} /> Total</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: 'var(--accent)' }} /> Convertidos</span>
          </div>
        </div>

        {/* Donut mix */}
        <div className="card-pg p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Mix de Produtos</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Por tipo de bem</p>
            </div>
            <AddLeadButton tenantId={tenantId} sellers={sellerRanking.map(s => ({ id: s.id, name: s.name }))} label="+ Lead" color="#00D4C8" />
          </div>
          {mixProdutos.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sem dados no período</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <DonutChart segments={mixProdutos.map((m) => ({ pct: m.pct, color: m.color }))} />
              </div>
              <div className="flex flex-col gap-2">
                {mixProdutos.map((m) => (
                  <div key={m.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.count}</span>
                      <span className="text-xs font-bold" style={{ color: m.color }}>{m.pct.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Ranking + Funil ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Ranking */}
        <div className="card-pg p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={16} style={{ color: '#FFB547' }} />
              <div>
                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Ranking de Vendedores</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Por conversões · {periodLabel}</p>
              </div>
            </div>
            <AddSellerButton tenantId={tenantId} />
          </div>
          {sellerRanking.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum vendedor cadastrado</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sellerRanking.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={i === 0 ? { backgroundColor: 'rgba(255,181,71,0.2)', color: '#FFB547' }
                      : i === 1 ? { backgroundColor: 'rgba(180,180,180,0.15)', color: '#aaa' }
                      : i === 2 ? { backgroundColor: 'rgba(205,127,50,0.15)', color: '#CD7F32' }
                      : { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.convertidos}/{s.leads}</span>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: s.taxa >= 20 ? 'rgba(37,211,102,0.12)' : 'var(--bg-tertiary)', color: s.taxa >= 20 ? '#25D366' : 'var(--text-muted)' }}>
                          {s.taxa.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Bar value={s.leads} max={maxLeads} color={i === 0 ? '#FFB547' : i === 1 ? '#aaa' : 'var(--accent)'} h={5} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Funil */}
        <div className="card-pg p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Funil de Conversão</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Distribuição por etapa do processo</p>
            </div>
            <AddLeadButton tenantId={tenantId} sellers={sellerRanking.map(s => ({ id: s.id, name: s.name }))} />
          </div>
          {totalLeads === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sem leads no período</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {funnelData.filter((f) => f.count > 0).map((f, i) => {
                const color = funnelColors[i] || 'var(--accent)'
                const pct = (f.count / totalLeads) * 100
                return (
                  <div key={f.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                      <div className="flex items-center gap-2">
                        {f.avgDays > 5 && !['convertido', 'perdido'].includes(f.status) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'rgba(255,181,71,0.15)', color: '#FFB547' }}>
                            ø{f.avgDays}d
                          </span>
                        )}
                        <span className="text-xs font-bold" style={{ color }}>{f.count}</span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <Bar value={f.count} max={totalLeads} color={color} h={12} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Aging de Propostas ── */}
      <div className="card-pg p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} style={{ color: '#FFB547' }} />
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Aging de Propostas — Gargalos do Funil</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Leads parados na mesma etapa há mais de 5 dias · Ação imediata recomendada
            </p>
          </div>
        </div>

        {agingAlerts.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.2)' }}>
            <span className="text-lg">✅</span>
            <span className="text-sm font-medium" style={{ color: '#25D366' }}>Nenhum gargalo identificado — funil fluindo bem!</span>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(agingAlerts.length, 4)}, 1fr)` }}>
            {agingAlerts.map((a) => (
              <div key={a.status} className="p-4 rounded-xl flex flex-col gap-1.5"
                style={{ backgroundColor: 'rgba(255,181,71,0.07)', border: '1px solid rgba(255,181,71,0.25)' }}>
                <p className="text-xs font-medium" style={{ color: '#FFB547' }}>{a.label}</p>
                <p className="text-3xl font-bold" style={{ color: '#FFB547' }}>{a.count}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>leads parados +5 dias</p>
              </div>
            ))}
          </div>
        )}

        {/* Stage breakdown */}
        <div className="grid grid-cols-4 gap-3">
          {funnelData.slice(0, 4).map((f, i) => (
            <div key={f.status} className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="text-[11px] mb-1.5" style={{ color: 'var(--text-muted)' }}>{f.label}</p>
              <p className="text-xl font-bold" style={{ color: funnelColors[i] }}>{f.count}</p>
              {f.avgDays > 0 && (
                <p className="text-[11px] mt-0.5" style={{ color: f.avgDays > 5 ? '#FFB547' : 'var(--text-muted)' }}>
                  ø {f.avgDays} dias
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Consorciados: Contemplação + Inadimplência + Assembleias ── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Contemplação donut */}
        <div className="card-pg p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Status de Contemplação</h2>
            <AddConsorciadoButton tenantId={tenantId} />
          </div>
          {totalCons === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sem consorciados cadastrados</p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <DonutChart segments={consDonut} />
                <div className="flex-1 flex flex-col gap-1.5">
                  {[
                    { label: 'Ativos', count: ativos.length, color: 'var(--accent)' },
                    { label: 'Contemplados', count: contemplados, color: '#A78BFA' },
                    { label: 'Inadimplentes', count: inadimplentes, color: '#FFB547' },
                    { label: 'Cancelados', count: cancelados, color: '#FF5C5C' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold" style={{ color: item.color }}>{item.count}</span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {((item.count / totalCons) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {contemplados > 0 && (
                <div className="px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: 'rgba(167,139,250,0.1)', color: '#A78BFA' }}>
                  🏆 {contemplados} cliente{contemplados !== 1 ? 's' : ''} contemplado{contemplados !== 1 ? 's' : ''} — excelente prova social!
                </div>
              )}
            </>
          )}
        </div>

        {/* Inadimplência & Churn */}
        <div className="card-pg p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Inadimplência & Churn</h2>
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-xl flex flex-col gap-2"
              style={{ backgroundColor: 'rgba(255,181,71,0.07)', border: '1px solid rgba(255,181,71,0.2)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Índice de Inadimplência</p>
              <p className="text-3xl font-bold" style={{ color: '#FFB547' }}>
                {totalCons > 0 ? ((inadimplentes / totalCons) * 100).toFixed(1) : '0'}%
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{inadimplentes} consorciados</p>
              <Bar value={inadimplentes} max={totalCons} color="#FFB547" h={5} />
            </div>
            <div className="p-4 rounded-xl flex flex-col gap-2"
              style={{ backgroundColor: 'rgba(255,92,92,0.07)', border: '1px solid rgba(255,92,92,0.2)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Churn de Vendas</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--danger)' }}>
                {totalCons > 0 ? ((cancelados / totalCons) * 100).toFixed(1) : '0'}%
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {cancelados} cancelados · {perdidos} leads perdidos
              </p>
              <Bar value={cancelados} max={totalCons} color="var(--danger)" h={5} />
            </div>
          </div>
        </div>

        {/* Assembleias */}
        <div className="card-pg p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Clock size={15} style={{ color: 'var(--accent)' }} />
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Radar de Assembleias</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Próximos 30 dias</p>
            </div>
          </div>
          {asmList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-4 gap-2">
              <span className="text-2xl">📅</span>
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>Nenhuma assembleia próxima</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {asmList.slice(0, 6).map((a, i) => {
                const date = new Date(a.date)
                const daysUntil = Math.ceil((date.getTime() - now.getTime()) / 86400000)
                const urgent = daysUntil <= 7
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ backgroundColor: urgent ? 'rgba(255,181,71,0.07)' : 'var(--bg-tertiary)', border: urgent ? '1px solid rgba(255,181,71,0.2)' : '1px solid transparent' }}>
                    <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0"
                      style={{ backgroundColor: urgent ? 'rgba(255,181,71,0.15)' : 'var(--bg-secondary)' }}>
                      <span className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>
                        {date.toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold leading-tight" style={{ color: urgent ? '#FFB547' : 'var(--text-primary)' }}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {Array.from(a.admins).join(', ') || 'Sem administradora'}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {a.count} cota{a.count !== 1 ? 's' : ''} · em {daysUntil}d
                      </p>
                    </div>
                    {urgent && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0"
                        style={{ backgroundColor: '#FFB547', color: '#000' }}>EM BREVE</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Mix de Administradoras ── */}
      {mixAdmin.length > 0 && (
        <div className="card-pg p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Mix de Administradoras — Portfólio Ativo</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Ranking por VGV em carteira</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {mixAdmin.map(([admin, data], i) => (
              <div key={admin} className="flex items-center gap-4">
                <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{i + 1}</div>
                <span className="text-xs w-40 shrink-0 truncate" style={{ color: 'var(--text-secondary)' }}>{admin}</span>
                <div className="flex-1">
                  <Bar value={data.vgv} max={maxVgv} color={adminColors[i] || 'var(--accent)'} h={10} />
                </div>
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{data.count} cotas</span>
                  <span className="text-xs font-bold w-24" style={{ color: adminColors[i] || 'var(--accent)' }}>
                    {formatCurrency(data.vgv)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
