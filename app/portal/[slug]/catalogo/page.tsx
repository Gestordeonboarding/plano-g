import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { LayoutGrid } from 'lucide-react'

const db = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TIPOS: Record<string, string> = {
  imovel: 'Imóvel', auto: 'Automóvel', moto: 'Moto', servico: 'Serviço', outros: 'Outros',
}
const TIPO_ICONS: Record<string, string> = {
  imovel: '🏠', auto: '🚗', moto: '🏍️', servico: '⚙️', outros: '📦',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

export default async function CatalogoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect(`/portal/${slug}/entrar`)

  const { data: tenant } = await db.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) redirect(`/portal/${slug}/entrar`)

  const tenantId = (tenant as { id: string }).id

  // Busca tenant_administradoras com suas cartas disponíveis
  const { data: tadms } = await db
    .from('tenant_administradoras')
    .select(`
      id, taxa_administracao, fundo_reserva,
      administradora:administradora_id ( nome, cor )
    `)
    .eq('tenant_id', tenantId)
    .eq('ativa', true)

  const { data: cartasRaw } = await db
    .from('cartas')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('disponivel', true)
    .order('tipo')
    .order('valor_credito')

  const cartas = (cartasRaw ?? []) as Array<{
    id: string; tenant_administradora_id: string; tipo: string
    valor_credito: number; prazo_meses: number; parcela_estimada: number | null
    contemplacao_media: number | null; descricao: string | null
  }>

  const admMap = Object.fromEntries((tadms ?? []).map((t) => [t.id, t]))

  // Agrupa por tipo
  const byTipo: Record<string, typeof cartas> = {}
  for (const c of cartas) {
    if (!byTipo[c.tipo]) byTipo[c.tipo] = []
    byTipo[c.tipo].push(c)
  }

  const tiposComCartas = Object.keys(TIPOS).filter((t) => byTipo[t]?.length)

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fu1{animation:fadeUp .35s ease both} .fu2{animation:fadeUp .35s ease .08s both}
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div className="fu1">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <LayoutGrid size={20} style={{ color: 'var(--tenant-primary)' }} />
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Catálogo de Produtos</h1>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Cartas disponíveis para aquisição · ordenadas por menor custo
          </p>
        </div>

        {tiposComCartas.length === 0 ? (
          <div className="fu2" style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>Nenhuma carta disponível no momento</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Fale com seu representante para verificar disponibilidade</p>
          </div>
        ) : (
          tiposComCartas.map((tipo, ti) => (
            <div key={tipo} className="fu2" style={{ animationDelay: `${ti * 0.07}s` }}>
              <p style={{
                fontSize: 13, fontWeight: 800, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
              }}>
                {TIPO_ICONS[tipo]} {TIPOS[tipo]}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {byTipo[tipo].map((carta, idx) => {
                  const tadm = admMap[carta.tenant_administradora_id]
                  const adm = tadm?.administradora as { nome: string; cor: string } | undefined
                  const custo = ((tadm?.taxa_administracao ?? 0) + (tadm?.fundo_reserva ?? 0))
                  const isDestaque = idx === 0

                  return (
                    <div key={carta.id} style={{
                      borderRadius: 16, overflow: 'hidden',
                      border: `1.5px solid ${isDestaque ? 'var(--tenant-primary)' : 'var(--border-color)'}`,
                      background: 'var(--bg-secondary)',
                    }}>
                      {isDestaque && (
                        <div style={{ height: 3, background: 'var(--tenant-primary)' }} />
                      )}
                      <div style={{ padding: '16px' }}>
                        {/* Administradora badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          {adm && (
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                              background: `${adm.cor}20`, color: adm.cor,
                            }}>
                              {adm.nome}
                            </span>
                          )}
                          {isDestaque && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,212,200,0.1)', color: 'var(--tenant-primary)' }}>
                              ⭐ Melhor opção
                            </span>
                          )}
                        </div>

                        {/* Valor principal */}
                        <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>
                          {fmt(carta.valor_credito)}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>crédito disponível</p>

                        {/* Grid de informações */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>PRAZO</p>
                            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{carta.prazo_meses} meses</p>
                          </div>
                          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>PARCELA EST.</p>
                            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                              {carta.parcela_estimada ? fmt(carta.parcela_estimada) : '—'}
                            </p>
                          </div>
                          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>CUSTO TOTAL</p>
                            <p style={{ fontSize: 17, fontWeight: 800, color: custo < 18 ? 'var(--accent)' : custo < 22 ? '#FFB547' : 'var(--danger)' }}>
                              {custo.toFixed(2)}%
                            </p>
                          </div>
                          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>CONTEMPLAÇÃO MÉD.</p>
                            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent)' }}>
                              {carta.contemplacao_media ? `${carta.contemplacao_media}%` : '—'}
                            </p>
                          </div>
                        </div>

                        {carta.descricao && (
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                            ℹ️ {carta.descricao}
                          </p>
                        )}

                        <a href={`/portal/${slug}/chat`} style={{
                          display: 'block', textAlign: 'center', padding: '11px 0', borderRadius: 12,
                          background: 'var(--tenant-primary)', color: '#000',
                          fontWeight: 800, fontSize: 14, textDecoration: 'none',
                        }}>
                          Tenho interesse — falar com meu representante
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
