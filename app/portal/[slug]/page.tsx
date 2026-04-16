import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Building2, Car, Zap, CreditCard, ChevronRight, Plus, TrendingUp } from 'lucide-react'

type AssetType = 'imovel' | 'automovel' | 'moto' | 'outros'

const ASSET_THEMES: Record<AssetType, { label: string; accent: string; icon: React.ReactNode }> = {
  imovel:    { label: 'Imóvel',     accent: '#D4AF37', icon: <Building2 size={16} /> },
  automovel: { label: 'Automóvel',  accent: '#ff4757', icon: <Car size={16} /> },
  moto:      { label: 'Moto',       accent: '#F6AD55', icon: <Zap size={16} /> },
  outros:    { label: 'Consórcio',  accent: '#00D4C8', icon: <CreditCard size={16} /> },
}

function getTheme(t: string | null) {
  return ASSET_THEMES[(t as AssetType) ?? 'outros'] ?? ASSET_THEMES.outros
}

export default async function PortalHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const authClient = await createClient()
  const db = await createServiceClient()

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect(`/portal/${slug}/entrar`)

  const { data: tenant } = await db.from('tenants').select('id, name').eq('slug', slug).single()
  if (!tenant) redirect(`/portal/${slug}/entrar`)

  let { data: cotas } = await db
    .from('consorciados')
    .select('id, full_name, credit_value, asset_type, status, administrator, installments_paid, total_installments, contemplation_score, seller_id')
    .eq('user_id', user.id)
    .eq('tenant_id', (tenant as { id: string }).id)
    .order('credit_value', { ascending: false })

  // Auto-link: se logado mas sem cotas, tenta linkar pelo CPF do email (CPF@portal.local)
  if (!cotas || cotas.length === 0) {
    const emailCpf = user.email?.replace('@portal.local', '')
    if (emailCpf && /^\d{11}$/.test(emailCpf)) {
      await db.from('consorciados')
        .update({ user_id: user.id })
        .eq('cpf', emailCpf)
        .eq('tenant_id', (tenant as { id: string }).id)
      const { data: relinked } = await db
        .from('consorciados')
        .select('id, full_name, credit_value, asset_type, status, administrator, installments_paid, total_installments, contemplation_score, seller_id')
        .eq('user_id', user.id)
        .eq('tenant_id', (tenant as { id: string }).id)
        .order('credit_value', { ascending: false })
      if (relinked) cotas = relinked
    }
  }

  if (!cotas || cotas.length === 0) redirect(`/portal/${slug}/entrar`)

  if (cotas.length === 1) redirect(`/portal/${slug}/cota/${cotas[0].id}`)

  // Buscar telefone do vendedor para WhatsApp
  const firstSellerId = (cotas[0] as { seller_id: string | null }).seller_id
  let sellerPhone: string | null = null
  if (firstSellerId) {
    const { data: seller } = await db.from('users').select('phone').eq('id', firstSellerId).single()
    sellerPhone = (seller as { phone: string | null } | null)?.phone ?? null
  }

  const firstName = (cotas[0] as { full_name: string }).full_name.split(' ')[0]
  const totalCredito = cotas.reduce((sum, c) => sum + ((c as { credit_value: number }).credit_value || 0), 0)
  const whatsappPhone = sellerPhone?.replace(/\D/g, '')
  const whatsappMsg = encodeURIComponent(`Olá! Sou ${firstName} e gostaria de conhecer novas opções de consórcio.`)
  const whatsappUrl = whatsappPhone ? `https://wa.me/55${whatsappPhone}?text=${whatsappMsg}` : null

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu1 { animation: fadeUp 0.5s ease 0.0s both; }
        .fu2 { animation: fadeUp 0.5s ease 0.1s both; }
        .fu3 { animation: fadeUp 0.5s ease 0.15s both; }
        .cota-link { transition: transform 0.15s ease; display: block; text-decoration: none; }
        .cota-link:active { transform: scale(0.98); }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Saudação */}
        <div className="fu1">
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Olá,</p>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {firstName}
          </h1>
        </div>

        {/* Resumo da carteira */}
        <div className="fu2" style={{
          borderRadius: 16, padding: '16px',
          background: 'linear-gradient(135deg, var(--tenant-primary) 0%, #7c3aed 100%)',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            Total em crédito
          </p>
          <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>
            {formatCurrency(totalCredito)}
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>Contratos</p>
              <p style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>{cotas.length}</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>Administradora</p>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                {(cotas[0] as { administrator: string | null }).administrator || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de cotas */}
        <div className="fu3">
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Meus consórcios
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cotas.map((cota, i) => {
              const c = cota as {
                id: string; credit_value: number; asset_type: string | null
                status: string | null; administrator: string | null
                installments_paid: number; total_installments: number | null
                contemplation_score: number
              }
              const theme = getTheme(c.asset_type)
              const pct = c.total_installments ? Math.round((c.installments_paid / c.total_installments) * 100) : 0

              return (
                <Link
                  key={c.id}
                  href={`/portal/${slug}/cota/${c.id}`}
                  className="cota-link"
                  style={{ animation: `fadeUp 0.5s ease ${0.2 + i * 0.07}s both` }}
                >
                  <div style={{
                    borderRadius: 14, padding: '14px 16px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: `${theme.accent}18`,
                          border: `1px solid ${theme.accent}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: theme.accent,
                        }}>
                          {theme.icon}
                        </div>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{theme.label}</p>
                          <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.administrator || '—'}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {c.status === 'ativo' && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                            background: 'rgba(0,212,200,0.12)', color: '#00D4C8',
                            border: '1px solid rgba(0,212,200,0.2)',
                          }}>ATIVO</span>
                        )}
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>

                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 10 }}>
                      {formatCurrency(c.credit_value)}
                    </p>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.installments_paid} parcelas pagas</span>
                        <span style={{ fontSize: 10, color: theme.accent, fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 3, backgroundColor: 'var(--bg-tertiary)' }}>
                        <div style={{ height: 3, borderRadius: 3, width: `${pct}%`, backgroundColor: theme.accent }} />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* CTA novo consórcio */}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', borderRadius: 14,
              background: 'rgba(37,211,102,0.1)',
              border: '1px solid rgba(37,211,102,0.25)',
              color: '#25D366', fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}
          >
            <Plus size={17} />
            Quero um novo consórcio
          </a>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 14,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)', fontSize: 13,
          }}>
            <TrendingUp size={16} />
            Fale com seu consultor para novos consórcios
          </div>
        )}
      </div>
    </>
  )
}
