import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import Link from 'next/link'
import {
  Building2, Car, Zap, CreditCard, ChevronLeft, Bell,
  TrendingUp, FileText, MessageCircle, LayoutGrid,
  Calendar, Receipt, Gavel, User, Star,
} from 'lucide-react'

type AssetType = 'imovel' | 'automovel' | 'moto' | 'outros'

const THEMES: Record<AssetType, {
  label: string
  bg: string
  bgCard: string
  accent: string
  accentDim: string
  border: string
  orb1: string
  orb2: string
  orb3: string
  icon: React.ReactNode
  bigEmoji: string
  pattern: string
}> = {
  imovel: {
    label: 'Imóvel',
    bg: 'linear-gradient(160deg, #040c18 0%, #071828 50%, #030a12 100%)',
    bgCard: 'rgba(212,175,55,0.06)',
    accent: '#D4AF37',
    accentDim: 'rgba(212,175,55,0.15)',
    border: 'rgba(212,175,55,0.2)',
    orb1: 'rgba(212,175,55,0.18)',
    orb2: 'rgba(180,130,20,0.10)',
    orb3: 'rgba(212,175,55,0.06)',
    icon: <Building2 size={26} />,
    bigEmoji: '🏛️',
    pattern: 'repeating-linear-gradient(45deg, rgba(212,175,55,0.03) 0px, rgba(212,175,55,0.03) 1px, transparent 1px, transparent 40px)',
  },
  automovel: {
    label: 'Automóvel',
    bg: 'linear-gradient(160deg, #080205 0%, #130408 50%, #060102 100%)',
    bgCard: 'rgba(255,71,87,0.06)',
    accent: '#ff4757',
    accentDim: 'rgba(255,71,87,0.15)',
    border: 'rgba(255,71,87,0.2)',
    orb1: 'rgba(255,71,87,0.18)',
    orb2: 'rgba(180,20,30,0.12)',
    orb3: 'rgba(255,71,87,0.06)',
    icon: <Car size={26} />,
    bigEmoji: '🏎️',
    pattern: 'repeating-linear-gradient(80deg, rgba(255,71,87,0.03) 0px, rgba(255,71,87,0.03) 1px, transparent 1px, transparent 60px)',
  },
  moto: {
    label: 'Moto',
    bg: 'linear-gradient(160deg, #0a0700 0%, #160c00 50%, #070400 100%)',
    bgCard: 'rgba(246,173,85,0.06)',
    accent: '#F6AD55',
    accentDim: 'rgba(246,173,85,0.15)',
    border: 'rgba(246,173,85,0.2)',
    orb1: 'rgba(246,173,85,0.18)',
    orb2: 'rgba(180,100,20,0.10)',
    orb3: 'rgba(246,173,85,0.06)',
    icon: <Zap size={26} />,
    bigEmoji: '🏍️',
    pattern: 'repeating-linear-gradient(-45deg, rgba(246,173,85,0.03) 0px, rgba(246,173,85,0.03) 1px, transparent 1px, transparent 50px)',
  },
  outros: {
    label: 'Consórcio',
    bg: 'linear-gradient(160deg, #040c10 0%, #071820 50%, #030a10 100%)',
    bgCard: 'rgba(0,212,200,0.06)',
    accent: '#00D4C8',
    accentDim: 'rgba(0,212,200,0.15)',
    border: 'rgba(0,212,200,0.2)',
    orb1: 'rgba(0,212,200,0.18)',
    orb2: 'rgba(0,150,150,0.10)',
    orb3: 'rgba(0,212,200,0.06)',
    icon: <CreditCard size={26} />,
    bigEmoji: '💎',
    pattern: 'repeating-linear-gradient(45deg, rgba(0,212,200,0.03) 0px, rgba(0,212,200,0.03) 1px, transparent 1px, transparent 40px)',
  },
}

function getTheme(assetType: string | null) {
  return THEMES[(assetType as AssetType) ?? 'outros'] ?? THEMES.outros
}

export default async function CotaPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const authClient = await createClient()
  const db = await createServiceClient()

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect(`/portal/${slug}/entrar`)

  const { data: tenant } = await db
    .from('tenants').select('id, name').eq('slug', slug).single()
  if (!tenant) redirect(`/portal/${slug}/entrar`)

  const { data: con } = await db
    .from('consorciados')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('tenant_id', (tenant as { id: string }).id)
    .single()

  if (!con) redirect(`/portal/${slug}`)

  const c = con as {
    id: string; full_name: string; credit_value: number
    asset_type: string | null
    group_number: string | null; quota_number: string | null
    installments_paid: number; total_installments: number | null
    monthly_installment: number | null; next_assembly_date: string | null
    contemplation_score: number; status: string; administrator: string | null
    cpf: string | null; phone: string | null; email: string | null
  }

  const theme = getTheme(c.asset_type)
  const pct = c.total_installments ? Math.round((c.installments_paid / c.total_installments) * 100) : 0
  const dias = daysUntil(c.next_assembly_date)
  const score = c.contemplation_score || 0

  let scoreColor = '#ff4757'
  let scoreLabel = 'Baixo'
  let scorePhrase = 'Continue em dia com as parcelas para melhorar seu score.'
  if (score >= 70) {
    scoreColor = '#00D4C8'; scoreLabel = 'Alto'
    scorePhrase = 'Ótimo! Você tem grande chance de contemplação. Considere ofertar um lance.'
  } else if (score >= 40) {
    scoreColor = '#F6AD55'; scoreLabel = 'Médio'
    scorePhrase = 'Chances moderadas. Considere um lance na próxima assembleia.'
  }

  const acoes = [
    { label: 'Simular Lance', icon: <TrendingUp size={20} />, href: `/portal/${slug}/simulador`, color: theme.accent },
    { label: 'Ofertar Lance', icon: <Gavel size={20} />, href: `/portal/${slug}/lance`, color: theme.accent },
    { label: 'Parcelas', icon: <Receipt size={20} />, href: `/portal/${slug}/parcelas`, color: theme.accent },
    { label: 'Documentos', icon: <FileText size={20} />, href: `/portal/${slug}/documentos`, color: theme.accent },
    { label: 'Falar c/ Corretor', icon: <MessageCircle size={20} />, href: `/portal/${slug}/chat`, color: theme.accent },
    { label: 'Assembleias', icon: <Calendar size={20} />, href: `/portal/${slug}/assembleias`, color: theme.accent },
    { label: 'Minha Carteira', icon: <LayoutGrid size={20} />, href: `/portal/${slug}`, color: 'rgba(255,255,255,0.5)' },
    { label: 'Meu Perfil', icon: <User size={20} />, href: `/portal/${slug}/perfil`, color: 'rgba(255,255,255,0.5)' },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-14px) rotate(4deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes scoreBar {
          from { width: 0%; }
          to   { width: var(--score-pct); }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to   { width: var(--prog-pct); }
        }
        .fu1 { animation: fadeUp 0.6s ease 0.0s both; }
        .fu2 { animation: fadeUp 0.6s ease 0.1s both; }
        .fu3 { animation: fadeUp 0.6s ease 0.2s both; }
        .fu4 { animation: fadeUp 0.6s ease 0.3s both; }
        .fu5 { animation: fadeUp 0.6s ease 0.4s both; }
        .fu6 { animation: fadeUp 0.6s ease 0.5s both; }
        .float-emoji { animation: floatSlow 8s ease-in-out infinite; }
        .glow-orb { animation: glowPulse 5s ease-in-out infinite; }
        .score-bar-fill {
          height: 100%; border-radius: 4px;
          background: linear-gradient(90deg, var(--score-color), var(--score-color-dim));
          animation: scoreBar 1.2s cubic-bezier(.22,1,.36,1) 0.5s both;
          --score-pct: ${score}%;
          width: var(--score-pct);
        }
        .prog-bar-fill {
          height: 100%; border-radius: 4px;
          background: linear-gradient(90deg, var(--theme-accent), var(--theme-accent-dim));
          animation: progressBar 1.2s cubic-bezier(.22,1,.36,1) 0.5s both;
          --prog-pct: ${pct}%;
          width: var(--prog-pct);
        }
        .acao-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 8px; padding: 18px 8px; border-radius: 18px;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(12px);
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .acao-btn:active { transform: scale(0.95); background: rgba(255,255,255,0.08); }
      `}</style>

      {/* Escape layout padding */}
      <div style={{
        margin: '-20px -16px',
        minHeight: 'calc(100vh - 56px)',
        background: theme.bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Pattern overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: theme.pattern, pointerEvents: 'none' }} />

        {/* Glow orbs */}
        <div className="glow-orb" style={{
          position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
          width: 340, height: 340, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.orb1} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '30%', right: '-80px',
          width: 250, height: 250, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.orb2} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '-50px',
          width: 200, height: 200, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.orb3} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Big watermark emoji */}
        <div className="float-emoji" style={{
          position: 'absolute', right: '-10px', top: '8%',
          fontSize: 120, opacity: 0.06, pointerEvents: 'none', userSelect: 'none',
        }}>
          {theme.bigEmoji}
        </div>

        {/* Top bar */}
        <div className="fu1" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px',
          borderBottom: `1px solid ${theme.border}`,
          position: 'relative', zIndex: 10,
        }}>
          <Link href={`/portal/${slug}`} style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <ChevronLeft size={22} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `${theme.accent}22`,
              border: `1px solid ${theme.accent}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: theme.accent,
            }}>
              {theme.icon}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{theme.label}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                Grupo {c.group_number || '—'} · Cota {c.quota_number || '—'}
              </p>
            </div>
          </div>
          {c.status && (
            <div style={{ marginLeft: 'auto' }}>
              <span style={{
                fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
                padding: '4px 10px', borderRadius: 20,
                background: c.status === 'ativo' ? 'rgba(0,212,200,0.15)' : 'rgba(255,255,255,0.08)',
                color: c.status === 'ativo' ? '#00D4C8' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${c.status === 'ativo' ? 'rgba(0,212,200,0.3)' : 'rgba(255,255,255,0.1)'}`,
              }}>
                {c.status}
              </span>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '20px 20px 100px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Alerta assembleia */}
          {dias !== null && dias <= 15 && (
            <div className="fu1" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 16,
              background: 'rgba(246,173,85,0.1)',
              border: '1px solid rgba(246,173,85,0.25)',
            }}>
              <Bell size={17} color="#F6AD55" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#F6AD55' }}>
                  Assembleia em {dias} dia{dias !== 1 ? 's' : ''}!
                </p>
                {c.next_assembly_date && (
                  <p style={{ fontSize: 11, color: 'rgba(246,173,85,0.7)' }}>{formatDate(c.next_assembly_date)}</p>
                )}
              </div>
            </div>
          )}

          {/* Card principal */}
          <div className="fu2" style={{
            borderRadius: 22, padding: '22px',
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            backdropFilter: 'blur(20px)',
          }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Valor do crédito
            </p>
            <p style={{ fontSize: 36, fontWeight: 900, color: theme.accent, letterSpacing: '-0.02em', marginBottom: 18 }}>
              {formatCurrency(c.credit_value)}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 18 }}>
              {[
                { label: 'Parcela mensal', value: formatCurrency(c.monthly_installment) },
                { label: 'Próx. assembleia', value: c.next_assembly_date ? formatDate(c.next_assembly_date) : '—' },
                { label: 'Administradora', value: c.administrator || '—' },
                { label: 'Parcelas pagas', value: `${c.installments_paid} / ${c.total_installments || '—'}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Progresso do consórcio</span>
                <span style={{ fontSize: 10, color: theme.accent, fontWeight: 700 }}>{pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="prog-bar-fill"
                  style={{ '--theme-accent': theme.accent, '--theme-accent-dim': theme.accentDim } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          {/* Score de contemplação */}
          <div className="fu3" style={{
            borderRadius: 22, padding: '20px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Score de contemplação
              </p>
              <Star size={14} color={scoreColor} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</span>
              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                  background: `${scoreColor}18`, color: scoreColor,
                  border: `1px solid ${scoreColor}33`, display: 'inline-block', marginBottom: 8,
                }}>
                  {scoreLabel}
                </span>
                <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="score-bar-fill"
                    style={{ '--score-color': scoreColor, '--score-color-dim': `${scoreColor}55` } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{scorePhrase}</p>
          </div>

          {/* Ações */}
          <div className="fu4">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
              O que você quer fazer?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {acoes.map((a, i) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="acao-btn"
                  style={{ animation: `fadeUp 0.5s ease ${0.3 + i * 0.05}s both` }}
                >
                  <span style={{ color: a.color }}>{a.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.3 }}>
                    {a.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
