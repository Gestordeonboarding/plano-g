'use client'

/**
 * RankingView — visualização lista do Modo TV.
 * Mostra todos os vendedores do tenant ordenados por conversões.
 * Cada linha tem medalha (🥇🥈🥉), avatar inicial, nome, barra de
 * progresso e métricas (conversões + crédito total).
 */

import { SellerRankingItem } from '@/lib/tv/getRanking'

const MEDALS = ['🥇', '🥈', '🥉']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function RankingView({ sellers }: { sellers: SellerRankingItem[] }) {
  const maxConversions = Math.max(...sellers.map((s) => s.conversions), 1)
  const allZero = sellers.every((s) => s.conversions === 0)

  return (
    <div
      style={{
        height: '100%',
        padding: '40px 64px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto',
      }}
    >
      {sellers.map((seller, index) => {
        const barWidth =
          maxConversions > 0 ? (seller.conversions / maxConversions) * 100 : 0
        const isFirst = index === 0 && seller.conversions > 0
        const medal = MEDALS[index] ?? `${index + 1}º`

        return (
          <div
            key={seller.id}
            style={{
              background: isFirst ? 'rgba(0,196,180,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isFirst ? 'rgba(0,196,180,0.3)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 16,
              padding: '28px 36px',
              display: 'grid',
              gridTemplateColumns: '64px 1fr auto',
              gap: 24,
              alignItems: 'center',
              transition: 'all 0.4s ease',
            }}
          >
            {/* Medalha / posição */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, lineHeight: 1 }}>{medal}</div>
              {index >= 3 && (
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.25)',
                    marginTop: 4,
                  }}
                >
                  {index + 1}º
                </div>
              )}
            </div>

            {/* Avatar + nome + barra */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: isFirst ? 'rgba(0,196,180,0.2)' : 'rgba(255,255,255,0.06)',
                    border: `2px solid ${isFirst ? 'rgba(0,196,180,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                    color: isFirst ? '#00c4b4' : 'rgba(255,255,255,0.4)',
                    flexShrink: 0,
                  }}
                >
                  {seller.avatar_initial}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      color: isFirst ? '#ffffff' : 'rgba(255,255,255,0.75)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {seller.full_name}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {seller.leads_count} leads · {seller.conversion_rate}% de conversão
                    {seller.last_conversion_at && (
                      <>
                        {' · Última venda: '}
                        {new Date(seller.last_conversion_at).toLocaleDateString('pt-BR')}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de progresso */}
              <div
                style={{
                  height: 6,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${barWidth}%`,
                    background: isFirst
                      ? 'linear-gradient(90deg, #00897b, #00c4b4)'
                      : 'rgba(255,255,255,0.15)',
                    borderRadius: 3,
                    transition: 'width 1s ease',
                  }}
                />
              </div>
            </div>

            {/* Métricas */}
            <div style={{ textAlign: 'right', minWidth: 200 }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: isFirst ? '#00c4b4' : 'rgba(255,255,255,0.6)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {seller.conversions}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                {seller.conversions === 1 ? 'conversão' : 'conversões'}
              </div>
              {seller.credit_total > 0 && (
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: 'rgba(0,196,180,0.7)',
                    marginTop: 8,
                  }}
                >
                  {formatCurrency(seller.credit_total)}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Estado vazio quando ninguém tem vendas no mês */}
      {sellers.length > 0 && allZero && (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: 'rgba(255,255,255,0.2)',
            fontSize: 18,
          }}
        >
          Nenhuma conversão registrada este mês ainda. O ranking já está ativo.
        </div>
      )}

      {sellers.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: 'rgba(255,255,255,0.2)',
            fontSize: 18,
          }}
        >
          Nenhum vendedor cadastrado.
        </div>
      )}
    </div>
  )
}
