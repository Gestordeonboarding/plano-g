import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import Link from 'next/link'
import { Bell, TrendingUp, FileText, MessageCircle } from 'lucide-react'

export default async function PortalHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/portal/${slug}/entrar`)

  // Buscar consorciado vinculado ao usuário logado neste tenant
  const { data: tenant } = await supabase
    .from('tenants').select('id').eq('slug', slug).single()

  if (!tenant) redirect(`/portal/${slug}/login`)

  const { data: con } = await supabase
    .from('consorciados')
    .select('*')
    .eq('user_id', user.id)
    .eq('tenant_id', (tenant as { id: string }).id)
    .single()

  if (!con) redirect(`/portal/${slug}/login`)

  const c = con as {
    id: string; full_name: string; credit_value: number
    group_number: string | null; quota_number: string | null
    installments_paid: number; total_installments: number | null
    monthly_installment: number | null; next_assembly_date: string | null
    contemplation_score: number; status: string; administrator: string | null
  }

  const pct = c.total_installments ? Math.round((c.installments_paid / c.total_installments) * 100) : 0
  const dias = daysUntil(c.next_assembly_date)
  const score = c.contemplation_score

  let scoreColor = 'var(--danger)'
  let scoreLabel = 'Baixo'
  let scorePhrase = 'Seu score está baixo. Continue em dia com as parcelas para melhorar.'
  if (score >= 70) {
    scoreColor = 'var(--accent)'
    scoreLabel = 'Alto'
    scorePhrase = 'Ótimo! Você tem grande chance de contemplação. Simule um lance agora.'
  } else if (score >= 40) {
    scoreColor = '#FFB547'
    scoreLabel = 'Médio'
    scorePhrase = 'Você tem chances moderadas. Considere ofertar um lance na próxima assembleia.'
  }

  const atalhos = [
    { label: 'Simular lance', href: `/portal/${slug}/simulador`, icon: <TrendingUp size={20} /> },
    { label: 'Documentos', href: `/portal/${slug}/documentos`, icon: <FileText size={20} /> },
    { label: 'Falar com corretor', href: `/portal/${slug}/chat`, icon: <MessageCircle size={20} /> },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Saudação */}
      <div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Olá,</p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {c.full_name.split(' ')[0]}
        </h1>
      </div>

      {/* Alerta de assembleia próxima */}
      {dias !== null && dias <= 15 && (
        <div
          className="flex items-center gap-3 rounded-xl p-4"
          style={{ backgroundColor: 'rgba(255,181,71,0.12)', border: '1px solid rgba(255,181,71,0.3)' }}
        >
          <Bell size={18} style={{ color: '#FFB547' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#FFB547' }}>
              Assembleia em {dias} dia{dias !== 1 ? 's' : ''}!
            </p>
            {c.next_assembly_date && (
              <p className="text-xs" style={{ color: '#FFB547', opacity: 0.8 }}>
                {formatDate(c.next_assembly_date)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Card principal da cota */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Valor do crédito</p>
        <p className="text-3xl font-bold mb-4" style={{ color: 'var(--tenant-primary)' }}>
          {formatCurrency(c.credit_value)}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <InfoItem label="Grupo / Cota" value={`${c.group_number || '—'} / ${c.quota_number || '—'}`} />
          <InfoItem label="Administradora" value={c.administrator || '—'} />
          <InfoItem label="Parcela mensal" value={formatCurrency(c.monthly_installment)} />
          <InfoItem label="Próx. assembleia" value={c.next_assembly_date ? formatDate(c.next_assembly_date) : '—'} />
        </div>

        {/* Barra de progresso */}
        <div>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <span>{c.installments_paid} parcelas pagas</span>
            <span>{c.total_installments || '—'} total · {pct}%</span>
          </div>
          <div className="h-2.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div
              className="h-2.5 rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: 'var(--tenant-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Score de contemplação */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Score de contemplação</p>
        <div className="flex items-center gap-4 mb-3">
          <span className="text-5xl font-bold" style={{ color: scoreColor }}>{score}</span>
          <div className="flex-1">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold inline-block mb-1"
              style={{ backgroundColor: `${scoreColor}22`, color: scoreColor }}
            >
              {scoreLabel}
            </span>
            <div className="h-2.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div
                className="h-2.5 rounded-full transition-all"
                style={{ width: `${score}%`, backgroundColor: scoreColor }}
              />
            </div>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{scorePhrase}</p>
      </div>

      {/* Atalhos */}
      <div className="grid grid-cols-3 gap-3">
        {atalhos.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <span style={{ color: 'var(--tenant-primary)' }}>{a.icon}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}
