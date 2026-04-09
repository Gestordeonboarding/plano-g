import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { BarChart3, TrendingUp, Users, UserCheck, Target, MessageCircle, Eye, Presentation } from 'lucide-react'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  const u = userData as { tenant_id: string; role: string } | null
  if (!u) redirect('/login')

  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString()
  const firstOf6MonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString()

  // Buscas paralelas
  const [
    leadsAll,
    leadsMes,
    leadsUltimos6Meses,
    consorciados,
    apresentacoes,
    whatsappMes,
    sellers,
  ] = await Promise.all([
    // Todos os leads (sem limite — para análise de funil)
    supabase.from('leads')
      .select('id, status, created_at, qualification_score, asset_type, source, seller_id')
      .eq('tenant_id', u.tenant_id),

    // Leads deste mês
    supabase.from('leads')
      .select('id, status, qualification_score, seller_id')
      .eq('tenant_id', u.tenant_id)
      .gte('created_at', firstOfMonth),

    // Leads últimos 6 meses para gráfico
    supabase.from('leads')
      .select('id, status, created_at')
      .eq('tenant_id', u.tenant_id)
      .gte('created_at', firstOf6MonthsAgo),

    // Consorciados
    supabase.from('consorciados')
      .select('id, status, credit_value, contemplation_score, administrator, created_at')
      .eq('tenant_id', u.tenant_id),

    // Apresentações
    supabase.from('presentations')
      .select('id, status, view_count, created_at')
      .eq('tenant_id', u.tenant_id),

    // WhatsApp enviadas este mês
    supabase.from('whatsapp_messages')
      .select('id, status')
      .eq('tenant_id', u.tenant_id)
      .gte('sent_at', firstOfMonth),

    // Vendedores
    supabase.from('users')
      .select('id, full_name')
      .eq('tenant_id', u.tenant_id)
      .eq('role', 'seller'),
  ])

  const allLeads = (leadsAll.data || []) as Array<{
    id: string; status: string; created_at: string; qualification_score: number
    asset_type: string | null; source: string; seller_id: string | null
  }>

  const mesLeads = (leadsMes.data || []) as Array<{
    id: string; status: string; qualification_score: number; seller_id: string | null
  }>

  const ultimos6 = (leadsUltimos6Meses.data || []) as Array<{ id: string; status: string; created_at: string }>
  const cons = (consorciados.data || []) as Array<{
    id: string; status: string; credit_value: number; contemplation_score: number
    administrator: string | null; created_at: string
  }>
  const apres = (apresentacoes.data || []) as Array<{ id: string; status: string; view_count: number; created_at: string }>
  const wpMes = (whatsappMes.data || []) as Array<{ id: string; status: string }>
  const sellersArr = (sellers.data || []) as Array<{ id: string; full_name: string }>

  // ── Métricas gerais ──────────────────────────────────────────
  const totalLeads = allLeads.length
  const totalMes = mesLeads.length
  const convertidosMes = mesLeads.filter((l) => l.status === 'convertido').length
  const taxaConversao = totalMes > 0 ? ((convertidosMes / totalMes) * 100).toFixed(1) : '0'

  const consAtivos = cons.filter((c) => c.status === 'ativo').length
  const creditoTotal = cons.filter((c) => c.status === 'ativo').reduce((sum, c) => sum + (c.credit_value || 0), 0)

  const totalApres = apres.length
  const totalViews = apres.reduce((sum, a) => sum + (a.view_count || 0), 0)
  const wpEnviadas = wpMes.length
  const wpFalhas = wpMes.filter((m) => m.status === 'falhou').length

  // ── Funil de leads (todos os tempos) ──────────────────────────
  const STATUS_ORDER = ['novo', 'contato_feito', 'proposta_enviada', 'documentacao', 'convertido', 'perdido']
  const STATUS_LABEL: Record<string, string> = {
    novo: 'Novo', contato_feito: 'Contato feito', proposta_enviada: 'Proposta enviada',
    documentacao: 'Documentação', convertido: 'Convertido', perdido: 'Perdido',
  }
  const funnelCounts = STATUS_ORDER.map((s) => ({
    status: s,
    label: STATUS_LABEL[s],
    count: allLeads.filter((l) => l.status === s).length,
  }))
  const maxFunnel = Math.max(...funnelCounts.map((f) => f.count), 1)

  // ── Leads por mês (últimos 6) ──────────────────────────────────
  const monthsData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1)
    const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const label = d.toLocaleDateString('pt-BR', { month: 'short' })
    const count = ultimos6.filter((l) => {
      const dt = new Date(l.created_at)
      return dt >= d && dt < nextD
    }).length
    const converted = ultimos6.filter((l) => {
      const dt = new Date(l.created_at)
      return dt >= d && dt < nextD && l.status === 'convertido'
    }).length
    return { label, count, converted }
  })
  const maxMonth = Math.max(...monthsData.map((m) => m.count), 1)

  // ── Origem dos leads ──────────────────────────────────────────
  const sourceMap: Record<string, number> = {}
  allLeads.forEach((l) => { sourceMap[l.source] = (sourceMap[l.source] || 0) + 1 })
  const sources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxSource = Math.max(...sources.map((s) => s[1]), 1)

  // ── Tipo de bem ───────────────────────────────────────────────
  const assetMap: Record<string, number> = {}
  allLeads.forEach((l) => { const k = l.asset_type || 'outros'; assetMap[k] = (assetMap[k] || 0) + 1 })
  const assetData = Object.entries(assetMap).sort((a, b) => b[1] - a[1])
  const ASSET_LABEL: Record<string, string> = {
    imovel: 'Imóvel', auto: 'Auto', moto: 'Moto', servicos: 'Serviços', outros: 'Outros'
  }

  // ── Ranking de vendedores ─────────────────────────────────────
  const sellerRanking = sellersArr.map((s) => {
    const myLeads = allLeads.filter((l) => l.seller_id === s.id)
    const converted = myLeads.filter((l) => l.status === 'convertido').length
    const taxa = myLeads.length > 0 ? ((converted / myLeads.length) * 100).toFixed(0) : '0'
    return { ...s, leads: myLeads.length, converted, taxa }
  }).sort((a, b) => b.converted - a.converted)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(0,212,200,0.15)' }}>
          <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Relatórios</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Visão geral do desempenho do escritório</p>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: <Users size={18} />, label: 'Leads no mês', value: totalMes, sub: `${totalLeads} no total` },
          { icon: <Target size={18} />, label: 'Taxa de conversão', value: `${taxaConversao}%`, sub: `${convertidosMes} convertidos` },
          { icon: <UserCheck size={18} />, label: 'Consorciados ativos', value: consAtivos, sub: formatCurrency(creditoTotal) + ' em créditos' },
          { icon: <TrendingUp size={18} />, label: 'Score médio leads/mês', value: mesLeads.length > 0 ? Math.round(mesLeads.reduce((s, l) => s + l.qualification_score, 0) / mesLeads.length) : '—', sub: 'qualificação' },
        ].map((m) => (
          <div key={m.label} className="card-pg p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}>
              {m.icon}
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{m.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Linha 2: Gráfico de barras meses + Funil */}
      <div className="grid grid-cols-2 gap-6">

        {/* Leads por mês */}
        <div className="card-pg p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Leads por mês (últimos 6 meses)</h2>
          <div className="flex items-end gap-2 h-36">
            {monthsData.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.count}</span>
                <div className="w-full rounded-t-sm relative" style={{
                  height: `${Math.max(4, (m.count / maxMonth) * 112)}px`,
                  backgroundColor: 'rgba(0,212,200,0.25)',
                }}>
                  <div className="absolute bottom-0 left-0 right-0 rounded-t-sm" style={{
                    height: `${Math.max(2, (m.converted / Math.max(m.count, 1)) * 100)}%`,
                    backgroundColor: 'var(--accent)',
                  }} />
                </div>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: 'rgba(0,212,200,0.25)' }} /> Total</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: 'var(--accent)' }} /> Convertidos</span>
          </div>
        </div>

        {/* Funil de status */}
        <div className="card-pg p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Funil de leads (total)</h2>
          <div className="flex flex-col gap-2">
            {funnelCounts.map((f, i) => {
              const colors = ['#00D4C8', '#4ADE80', '#60A5FA', '#A78BFA', '#34D399', '#FF5C5C']
              const c = colors[i] || 'var(--accent)'
              return (
                <div key={f.status} className="flex items-center gap-3">
                  <span className="text-xs w-32 shrink-0" style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${(f.count / maxFunnel) * 100}%`,
                      backgroundColor: c,
                      opacity: 0.85,
                    }} />
                  </div>
                  <span className="text-xs font-bold w-6 text-right shrink-0" style={{ color: c }}>{f.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Linha 3: Origem + Tipo de bem */}
      <div className="grid grid-cols-2 gap-6">

        {/* Origem dos leads */}
        <div className="card-pg p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Origem dos leads</h2>
          {sources.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sem dados.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sources.map(([src, cnt]) => (
                <div key={src} className="flex items-center gap-3">
                  <span className="text-xs w-24 shrink-0 capitalize" style={{ color: 'var(--text-secondary)' }}>{src}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${(cnt / maxSource) * 100}%`,
                      backgroundColor: 'rgba(0,212,200,0.6)',
                    }} />
                  </div>
                  <span className="text-xs w-6 text-right shrink-0" style={{ color: 'var(--text-secondary)' }}>{cnt}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tipo de bem */}
        <div className="card-pg p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Leads por tipo de bem</h2>
          {assetData.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sem dados.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {assetData.map(([asset, cnt]) => {
                const pct = totalLeads > 0 ? ((cnt / totalLeads) * 100).toFixed(0) : '0'
                return (
                  <div key={asset} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {ASSET_LABEL[asset] || asset}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{cnt}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Linha 4: WhatsApp + Apresentações */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card-pg p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={15} style={{ color: '#25D366' }} />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>WhatsApp (mês atual)</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Mensagens enviadas', value: wpEnviadas - wpFalhas, color: 'var(--accent)' },
              { label: 'Falhas de envio', value: wpFalhas, color: 'var(--danger)' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 text-center"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-pg p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Presentation size={15} style={{ color: 'var(--accent)' }} />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Apresentações</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total', value: totalApres },
              { label: 'Visualizações', value: totalViews, icon: <Eye size={12} /> },
              { label: 'Visualizadas', value: apres.filter((a) => a.status === 'visualizada').length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 text-center"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranking de vendedores */}
      {sellerRanking.length > 0 && (
        <div className="card-pg overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Ranking de vendedores</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {['#', 'Vendedor', 'Leads', 'Convertidos', 'Taxa'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sellerRanking.map((s, i) => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : ''}`}
                      style={i > 0 ? { color: 'var(--text-muted)' } : {}}>
                      {i + 1}º
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{s.full_name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.leads}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.converted}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: Number(s.taxa) >= 20 ? 'rgba(0,212,200,0.15)' : 'var(--bg-tertiary)',
                        color: Number(s.taxa) >= 20 ? 'var(--accent)' : 'var(--text-muted)',
                      }}>
                      {s.taxa}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Consorciados por administradora */}
      {cons.length > 0 && (() => {
        const adminMap: Record<string, { count: number; credit: number }> = {}
        cons.filter((c) => c.status === 'ativo').forEach((c) => {
          const k = c.administrator || 'Não informado'
          if (!adminMap[k]) adminMap[k] = { count: 0, credit: 0 }
          adminMap[k].count++
          adminMap[k].credit += c.credit_value || 0
        })
        const adminData = Object.entries(adminMap).sort((a, b) => b[1].count - a[1].count)
        if (adminData.length === 0) return null

        return (
          <div className="card-pg overflow-hidden">
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Consorciados por administradora</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {['Administradora', 'Cotas ativas', 'Volume de crédito'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adminData.map(([admin, data]) => (
                  <tr key={admin} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{admin}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{data.count}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--accent)' }}>{formatCurrency(data.credit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })()}
    </div>
  )
}
