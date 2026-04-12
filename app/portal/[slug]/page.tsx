import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Building2, Car, Zap, CreditCard, ChevronRight, Trophy, TrendingUp } from 'lucide-react'

type AssetType = 'imovel' | 'automovel' | 'moto' | 'outros'

const THEMES: Record<AssetType, {
  label: string
  bg: string
  accent: string
  border: string
  icon: React.ReactNode
  emoji: string
}> = {
  imovel: {
    label: 'Imóvel',
    bg: 'linear-gradient(135deg, #0d1b2a 0%, #1a3a5c 60%, #0a1e35 100%)',
    accent: '#D4AF37',
    border: 'rgba(212,175,55,0.3)',
    icon: <Building2 size={22} />,
    emoji: '🏛️',
  },
  automovel: {
    label: 'Automóvel',
    bg: 'linear-gradient(135deg, #1a0408 0%, #2d0810 60%, #100205 100%)',
    accent: '#ff4757',
    border: 'rgba(255,71,87,0.3)',
    icon: <Car size={22} />,
    emoji: '🏎️',
  },
  moto: {
    label: 'Moto',
    bg: 'linear-gradient(135deg, #1a0f00 0%, #2d1a00 60%, #100800 100%)',
    accent: '#F6AD55',
    border: 'rgba(246,173,85,0.3)',
    icon: <Zap size={22} />,
    emoji: '🏍️',
  },
  outros: {
    label: 'Outros',
    bg: 'linear-gradient(135deg, #060d14 0%, #0d1f2d 60%, #040a10 100%)',
    accent: '#00D4C8',
    border: 'rgba(0,212,200,0.3)',
    icon: <CreditCard size={22} />,
    emoji: '💎',
  },
}

function getTheme(assetType: string | null): typeof THEMES['outros'] {
  return THEMES[(assetType as AssetType) ?? 'outros'] ?? THEMES.outros
}

export default async function PortalHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/portal/${slug}/entrar`)

  const { data: tenant } = await supabase
    .from('tenants').select('id, name').eq('slug', slug).single()

  if (!tenant) redirect(`/portal/${slug}/entrar`)

  const { data: cotas } = await supabase
    .from('consorciados')
    .select('id, full_name, credit_value, asset_type, status, administrator, installments_paid, total_installments, contemplation_score, group_number, quota_number')
    .eq('user_id', user.id)
    .eq('tenant_id', (tenant as { id: string }).id)
    .order('credit_value', { ascending: false })

  if (!cotas || cotas.length === 0) redirect(`/portal/${slug}/entrar`)

  // Se só tem uma cota, vai direto para ela
  if (cotas.length === 1) redirect(`/portal/${slug}/cota/${cotas[0].id}`)

  const firstName = (cotas[0] as { full_name: string }).full_name.split(' ')[0]
  const totalCredito = cotas.reduce((sum, c) => sum + ((c as { credit_value: number }).credit_value || 0), 0)

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px var(--glow-color, rgba(0,212,200,0.2)); }
          50%       { box-shadow: 0 0 40px var(--glow-color, rgba(0,212,200,0.4)); }
        }
        .cota-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .cota-card:active {
          transform: scale(0.98);
        }
        .total-shimmer {
          background: linear-gradient(90deg,
            rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.9) 30%,
            var(--tenant-primary) 50%,
            rgba(255,255,255,0.9) 70%, rgba(255,255,255,0.9) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .fu1 { animation: fadeUp 0.6s ease 0.0s both; }
        .fu2 { animation: fadeUp 0.6s ease 0.1s both; }
      `}</style>

      <div className="flex flex-col gap-6">

        {/* Saudação */}
        <div className="fu1">
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Olá,</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {firstName}
          </h1>
        </div>

        {/* Card total da carteira */}
        <div className="fu2" style={{
          borderRadius: 20, padding: '20px',
          background: 'linear-gradient(135deg, var(--tenant-primary) 0%, #7c3aed 100%)',
          boxShadow: '0 8px 32px rgba(0,212,200,0.25)',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            Sua Carteira de Crédito
          </p>
          <p className="total-shimmer" style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12 }}>
            {formatCurrency(totalCredito)}
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600 }}>CONTRATOS</p>
              <p style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>{cotas.length}</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600 }}>ADMINISTRADORA</p>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                {(cotas[0] as { administrator: string | null }).administrator || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Selecione um consórcio
          </p>
          <Trophy size={14} style={{ color: 'var(--tenant-primary)' }} />
        </div>

        {/* Cards de cota */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cotas.map((cota, i) => {
            const c = cota as {
              id: string; full_name: string; credit_value: number; asset_type: string | null
              status: string | null; administrator: string | null
              installments_paid: number; total_installments: number | null
              contemplation_score: number; group_number: string | null; quota_number: string | null
            }
            const theme = getTheme(c.asset_type)
            const pct = c.total_installments ? Math.round((c.installments_paid / c.total_installments) * 100) : 0
            const score = c.contemplation_score || 0
            const scoreColor = score >= 70 ? '#00D4C8' : score >= 40 ? '#F6AD55' : '#ff4757'

            return (
              <Link
                key={c.id}
                href={`/portal/${slug}/cota/${c.id}`}
                className="cota-card"
                style={{
                  display: 'block',
                  borderRadius: 22,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  animation: `cardIn 0.6s cubic-bezier(.22,1,.36,1) ${0.15 + i * 0.1}s both`,
                  border: `1px solid ${theme.border}`,
                  position: 'relative',
                }}
              >
                {/* Background temático */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: theme.bg,
                }} />

                {/* Orb de luz */}
                <div style={{
                  position: 'absolute', top: -40, right: -40,
                  width: 160, height: 160, borderRadius: '50%',
                  background: `radial-gradient(circle, ${theme.accent}22 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                {/* Emoji grande como watermark */}
                <div style={{
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 64, opacity: 0.07, pointerEvents: 'none',
                  userSelect: 'none',
                }}>
                  {theme.emoji}
                </div>

                {/* Conteúdo */}
                <div style={{ position: 'relative', padding: '20px 20px 16px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${theme.accent}22`,
                        border: `1px solid ${theme.accent}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: theme.accent,
                      }}>
                        {theme.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {theme.label}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                          Grupo {c.group_number || '—'} · Cota {c.quota_number || '—'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                  </div>

                  {/* Valor */}
                  <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 14 }}>
                    {formatCurrency(c.credit_value)}
                  </p>

                  {/* Progress */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        {c.installments_paid} parcelas pagas
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{
                        height: 4, borderRadius: 4,
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}88)`,
                        transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>

                  {/* Footer: score + admin + status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: `${scoreColor}18`,
                      border: `1px solid ${scoreColor}33`,
                      borderRadius: 8, padding: '4px 8px',
                    }}>
                      <TrendingUp size={10} color={scoreColor} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor }}>Score {score}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>·</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{c.administrator || '—'}</span>
                    {c.status && (
                      <>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>·</span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                          color: c.status === 'ativo' ? '#00D4C8' : 'rgba(255,255,255,0.35)',
                        }}>
                          {c.status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
