import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function RelatoriosPage() {
  const supabase = await createClient()

  const [tenantsRes, leadsRes, consorRes] = await Promise.all([
    supabase.from('tenants').select('id, name, is_active'),
    supabase.from('leads').select('id, status, source, created_at, tenant_id'),
    supabase.from('consorciados').select('id, status, credit_value, tenant_id'),
  ])

  const tenants = (tenantsRes.data || []) as Array<{ id: string; name: string; is_active: boolean }>
  const leads = (leadsRes.data || []) as Array<{ id: string; status: string; source: string; created_at: string; tenant_id: string }>
  const consorciados = (consorRes.data || []) as Array<{ id: string; status: string; credit_value: number; tenant_id: string }>

  const totalLeads = leads.length
  const convertidos = leads.filter((l) => l.status === 'convertido').length
  const taxaConversao = totalLeads > 0 ? ((convertidos / totalLeads) * 100).toFixed(1) : '0'

  const totalCredito = consorciados.reduce((sum, c) => sum + (c.credit_value || 0), 0)

  const porFonte = ['meta_ads', 'google_ads', 'indicacao', 'organico', 'manual'].map((source) => ({
    source,
    count: leads.filter((l) => l.source === source).length,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Relatórios
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Visão consolidada de toda a operação
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total de leads', value: totalLeads },
          { label: 'Convertidos', value: convertidos },
          { label: 'Taxa de conversão', value: `${taxaConversao}%` },
          {
            label: 'Crédito total em carteira',
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(totalCredito),
          },
        ].map((kpi) => (
          <div key={kpi.label} className="card-pg p-5">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {kpi.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* Leads por fonte */}
      <div className="card-pg p-6">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Leads por origem
        </h2>
        <div className="flex flex-col gap-3">
          {porFonte.map(({ source, count }) => {
            const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0
            const labels: Record<string, string> = {
              meta_ads: 'Meta Ads',
              google_ads: 'Google Ads',
              indicacao: 'Indicação',
              organico: 'Orgânico',
              manual: 'Manual',
            }
            return (
              <div key={source}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{labels[source]}</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: 'var(--accent)' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Consorciados por status */}
      <div className="card-pg p-6">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Consorciados por status
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {['ativo', 'contemplado', 'inadimplente', 'cancelado'].map((status) => {
            const count = consorciados.filter((c) => c.status === status).length
            const colors: Record<string, { bg: string; text: string }> = {
              ativo: { bg: 'rgba(0,212,200,0.15)', text: 'var(--accent)' },
              contemplado: { bg: 'rgba(130,100,220,0.15)', text: '#A78BFA' },
              inadimplente: { bg: 'rgba(255,181,71,0.15)', text: '#FFB547' },
              cancelado: { bg: 'rgba(255,92,92,0.15)', text: 'var(--danger)' },
            }
            const c = colors[status]
            return (
              <div key={status} className="p-4 rounded-xl text-center" style={{ backgroundColor: c.bg }}>
                <p className="text-2xl font-bold" style={{ color: c.text }}>{count}</p>
                <p className="text-xs mt-1 capitalize" style={{ color: c.text }}>{status}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
