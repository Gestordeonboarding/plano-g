import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatCurrency, formatPhone } from '@/lib/utils'

const COLUNAS = [
  { key: 'novo', label: 'Novo' },
  { key: 'contato_feito', label: 'Contato feito' },
  { key: 'proposta_enviada', label: 'Proposta enviada' },
  { key: 'documentacao', label: 'Documentação' },
  { key: 'convertido', label: 'Convertido' },
  { key: 'perdido', label: 'Perdido' },
] as const

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  novo: { bg: 'rgba(176,196,195,0.15)', text: 'var(--text-secondary)' },
  contato_feito: { bg: 'rgba(0,168,157,0.15)', text: 'var(--accent-mid)' },
  proposta_enviada: { bg: 'rgba(130,100,220,0.15)', text: '#A78BFA' },
  documentacao: { bg: 'rgba(255,181,71,0.15)', text: '#FFB547' },
  convertido: { bg: 'rgba(0,212,200,0.15)', text: 'var(--accent)' },
  perdido: { bg: 'rgba(255,92,92,0.15)', text: 'var(--danger)' },
}

const ASSET_LABEL: Record<string, string> = {
  imovel: 'Imóvel', auto: 'Auto', moto: 'Moto', servicos: 'Serviços', outros: 'Outros'
}

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  const u = userData as { tenant_id: string; role: string } | null
  if (!u) redirect('/login')

  const query = supabase
    .from('leads')
    .select('id, full_name, phone, desired_credit, asset_type, qualification_score, source, status, created_at, seller_id')
    .eq('tenant_id', u.tenant_id)
    .order('created_at', { ascending: false })

  const { data } = u.role === 'seller'
    ? await query.eq('seller_id', user.id)
    : await query

  const leads = (data || []) as Array<{
    id: string; full_name: string; phone: string; desired_credit: number | null
    asset_type: string | null; qualification_score: number; source: string
    status: string; created_at: string
  }>

  const byStatus = COLUNAS.reduce((acc, col) => {
    acc[col.key] = leads.filter((l) => l.status === col.key)
    return acc
  }, {} as Record<string, typeof leads>)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Leads</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        <Link href="/dashboard/leads/novo" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Novo lead
        </Link>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUNAS.map((col) => {
          const colLeads = byStatus[col.key]
          const style = STATUS_STYLE[col.key]
          return (
            <div
              key={col.key}
              className="flex flex-col gap-3 min-w-[240px] w-60 shrink-0 rounded-xl p-3"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              {/* Cabeçalho da coluna */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {col.label}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  {colLeads.length}
                </span>
              </div>

              {/* Cards */}
              {colLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="block rounded-xl p-3 transition-all"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <p className="font-semibold text-sm leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                    {lead.full_name}
                  </p>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {formatPhone(lead.phone)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {lead.asset_type && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: 'rgba(0,212,200,0.10)', color: 'var(--accent)' }}>
                        {ASSET_LABEL[lead.asset_type] || lead.asset_type}
                      </span>
                    )}
                    {lead.desired_credit && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: 'rgba(255,181,71,0.10)', color: '#FFB547' }}>
                        {formatCurrency(lead.desired_credit)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Score: {lead.qualification_score}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {lead.source}
                    </span>
                  </div>
                </Link>
              ))}

              {colLeads.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  Vazio
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
