import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatCurrency, formatDate, formatPhone, formatCPF, daysUntil } from '@/lib/utils'
import ActivatePortalButton from './ActivatePortalButton'
import EditConsorciado from './EditConsorciado'
import CallsSection from './CallsSection'

export default async function ConsorCiadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = (userData as { role: string } | null)?.role || 'seller'

  const query = supabase.from('consorciados').select('*').eq('id', id)
  const { data: c } = role === 'seller'
    ? await query.eq('seller_id', user.id).single()
    : await query.single()
  if (!c) notFound()

  const con = c as {
    id: string; full_name: string; cpf: string | null; phone: string | null; email: string | null
    credit_value: number; group_number: string | null; quota_number: string | null
    installments_paid: number; total_installments: number | null; monthly_installment: number | null
    next_assembly_date: string | null; administrator: string | null; status: string
    contemplation_score: number; user_id: string | null; tenant_id: string
  }

  const [assembliesRes, docsRes] = await Promise.all([
    supabase.from('assemblies').select('*').eq('consorciado_id', id).order('assembly_date', { ascending: false }).limit(10),
    supabase.from('documents').select('*').eq('consorciado_id', id).order('created_at', { ascending: false }),
  ])

  const assemblies = (assembliesRes.data || []) as Array<{
    id: string; assembly_date: string; winning_bid_percentage: number | null
    was_contemplated: boolean; draw_contemplated: boolean; bid_offered: number | null
  }>

  const docs = (docsRes.data || []) as Array<{
    id: string; name: string; file_url: string; type: string | null; created_at: string
  }>

  const pct = con.total_installments ? Math.round((con.installments_paid / con.total_installments) * 100) : 0
  const dias = daysUntil(con.next_assembly_date)
  const score = con.contemplation_score

  let scorePhrase = ''
  let scoreColor = 'var(--danger)'
  if (score >= 70) {
    scorePhrase = 'Ótimo! Você tem grande chance de contemplação.'
    scoreColor = 'var(--accent)'
  } else if (score >= 40) {
    scorePhrase = 'Chances moderadas. Considere um lance na próxima assembleia.'
    scoreColor = '#FFB547'
  } else {
    scorePhrase = 'Score baixo. Continue em dia para melhorar.'
    scoreColor = 'var(--danger)'
  }

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <Link href="/dashboard/consorciados" className="flex items-center gap-2 text-sm hover:underline"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={14} /> Voltar
      </Link>

      {/* Alerta de assembleia próxima */}
      {dias !== null && dias <= 15 && (
        <div className="alert-outdated flex items-center gap-2 rounded-lg">
          <span className="font-semibold">Assembleia em {dias} dia{dias !== 1 ? 's' : ''}!</span>
          {con.next_assembly_date && <span>· {formatDate(con.next_assembly_date)}</span>}
        </div>
      )}

      {/* Dados principais */}
      <div className="card-pg p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{con.full_name}</h1>
            <div className="flex flex-wrap gap-2 mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {con.cpf && <span>{formatCPF(con.cpf)}</span>}
              {con.phone && <span>· {formatPhone(con.phone)}</span>}
              {con.email && <span>· {con.email}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <EditConsorciado con={con} />
            <ActivatePortalButton consorciado={c as Record<string, unknown>} hasUser={!!con.user_id} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <InfoBox label="Crédito" value={formatCurrency(con.credit_value)} />
          <InfoBox label="Grupo / Cota" value={`${con.group_number || '—'} / ${con.quota_number || '—'}`} />
          <InfoBox label="Administradora" value={con.administrator || '—'} />
          <InfoBox label="Parcela mensal" value={formatCurrency(con.monthly_installment)} />
          <InfoBox label="Parcelas" value={`${con.installments_paid} / ${con.total_installments || '—'}`} />
          <InfoBox label="Próx. assembleia" value={con.next_assembly_date ? formatDate(con.next_assembly_date) : '—'} />
        </div>

        {/* Barra de progresso */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Progresso</span><span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: 'var(--accent)' }} />
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="card-pg p-6">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Score de contemplação</h2>
        <div className="flex items-center gap-6">
          <span className="text-5xl font-bold" style={{ color: scoreColor }}>{score}</span>
          <div className="flex-1">
            <div className="h-3 rounded-full mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="h-3 rounded-full transition-all"
                style={{ width: `${score}%`, backgroundColor: scoreColor }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{scorePhrase}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Progresso pago', pts: Math.round((con.installments_paid / (con.total_installments || 1)) * 40), max: 40 },
            { label: 'Histórico de lances', pts: 0, max: 30 },
            { label: 'Parcelas restantes', pts: (con.total_installments || 0) - con.installments_paid <= 12 ? 20 : (con.total_installments || 0) - con.installments_paid <= 24 ? 10 : 0, max: 20 },
            { label: 'Pontualidade', pts: con.status === 'ativo' ? 10 : 0, max: 10 },
          ].map((f) => (
            <div key={f.label} className="p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{f.label}</p>
              <p className="font-bold" style={{ color: 'var(--accent)' }}>{f.pts}<span className="text-xs font-normal text-muted-foreground">/{f.max}</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico de ligações */}
      <CallsSection
        consorciadoId={con.id}
        tenantId={con.tenant_id}
        contactName={con.full_name}
        contactPhone={con.phone}
      />

      {/* Histórico de assembleias */}
      {assemblies.length > 0 && (
        <div className="card-pg p-6">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Histórico de assembleias</h2>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                {['Data', 'Menor lance (%)', 'Lance ofertado', 'Contemplado'].map((h) => (
                  <th key={h} className="text-left pb-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assemblies.map((a) => (
                <tr key={a.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{formatDate(a.assembly_date)}</td>
                  <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
                    {a.winning_bid_percentage != null ? `${a.winning_bid_percentage}%` : '—'}
                  </td>
                  <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
                    {a.bid_offered != null ? formatCurrency(a.bid_offered) : '—'}
                  </td>
                  <td className="py-2">
                    {a.was_contemplated || a.draw_contemplated
                      ? <span className="badge-score-high">Sim</span>
                      : <span className="badge-score-low">Não</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Documentos */}
      <div className="card-pg p-6">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Documentos</h2>
        {docs.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum documento enviado.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {d.type || 'outro'} · {formatDate(d.created_at)}
                  </p>
                </div>
                <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                  Baixar
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
      <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}
