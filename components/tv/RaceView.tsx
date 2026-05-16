'use client'

/**
 * RaceView — visualização gamificada do ranking como uma corrida.
 *
 * Cada vendedor é uma pista horizontal. O carro do vendedor avança
 * proporcionalmente às suas conversões em relação ao líder. Carros
 * com vendas > 0 ficam vibrando (engineRevUp) e soltando fumaça do
 * escape. Linhas da pista se movem dando sensação de velocidade.
 *
 * Hierarquia de carros por posição:
 *   1º Ferrari · 2º Porsche · 3º Golf GTI · 4º HB20 · 5º Kwid
 *   6º Uno c/ Escada · 7º Kombi · 8º Biz · 9º Bicicleta · 10º+ Patinete
 */

import { useEffect, useState } from 'react'
import { SellerRankingItem } from '@/lib/tv/getRanking'

const CARS: { emoji: string; name: string }[] = [
  { emoji: '🏎️', name: 'Ferrari Roma' },
  { emoji: '🏎️', name: 'Porsche 911' },
  { emoji: '🚗', name: 'Golf GTI' },
  { emoji: '🚗', name: 'HB20' },
  { emoji: '🚗', name: 'Kwid' },
  { emoji: '🚙', name: 'Uno c/ Escada' },
  { emoji: '🚐', name: 'Kombi' },
  { emoji: '🛵', name: 'Biz 100' },
  { emoji: '🚲', name: 'Bicicleta' },
  { emoji: '🛴', name: 'Patinete' },
]

function getCar(position: number) {
  return CARS[Math.min(position, CARS.length - 1)]
}

/**
 * Calcula o % horizontal do carro na pista.
 * 0% = largada, 100% = chegada.
 * Líder vai pro extremo; outros proporcional às conversões dele.
 */
function calcTrackPosition(
  sellerConversions: number,
  maxConversions: number,
  minTrack = 4,
  maxTrack = 76,
): number {
  if (maxConversions === 0) return minTrack
  const pct = sellerConversions / maxConversions
  return minTrack + pct * (maxTrack - minTrack)
}

const STYLES = `
  @keyframes engineRevUp {
    0%   { transform: translate(0,-50%) rotate(0deg); }
    25%  { transform: translate(4px,-50%) rotate(1deg); }
    50%  { transform: translate(0,-50%) rotate(0deg); }
    75%  { transform: translate(-2px,-50%) rotate(-0.5deg); }
    100% { transform: translate(0,-50%) rotate(0deg); }
  }
  @keyframes exhaustSmoke {
    0%   { opacity: 0.8; transform: scale(1) translateX(0); }
    100% { opacity: 0; transform: scale(2.5) translateX(-20px); }
  }
  @keyframes roadLines {
    0%   { background-position: 0 0; }
    100% { background-position: -200px 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.6; }
  }
`

export function RaceView({ sellers }: { sellers: SellerRankingItem[] }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const maxConversions = Math.max(...sellers.map((s) => s.conversions), 1)

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{STYLES}</style>

      {/* Cabeçalho */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 24,
          padding: '0 48px',
          fontSize: 15,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        🏁 Grande Prêmio · {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
      </div>

      {/* Pistas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {sellers.map((seller, index) => {
          const car = getCar(index)
          const trackPct = calcTrackPosition(seller.conversions, maxConversions)
          const isLeader = index === 0 && seller.conversions > 0
          const hasMoved = seller.conversions > 0

          return (
            <div
              key={seller.id}
              style={{
                flex: 1,
                position: 'relative',
                borderBottom:
                  index < sellers.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                background: isLeader
                  ? 'rgba(0,196,180,0.04)'
                  : index % 2 === 0
                    ? 'rgba(255,255,255,0.01)'
                    : 'transparent',
              }}
            >
              {/* Coluna esquerda: medalha/posição */}
              <div
                style={{
                  width: 80,
                  textAlign: 'center',
                  flexShrink: 0,
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: 28, lineHeight: 1 }}>
                  {['🥇', '🥈', '🥉'][index] ?? `${index + 1}º`}
                </div>
              </div>

              {/* Pista */}
              <div style={{ flex: 1, position: 'relative', height: '100%', overflow: 'hidden' }}>
                {/* Linhas da pista em movimento (só anima se há vendas) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundImage:
                      'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 40px, transparent 40px, transparent 80px)',
                    backgroundSize: '200px 100%',
                    animation: hasMoved ? 'roadLines 1.2s linear infinite' : 'none',
                  }}
                />

                {/* Linha de chegada */}
                <div
                  style={{
                    position: 'absolute',
                    right: '18%',
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background:
                      'repeating-linear-gradient(180deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 8px, transparent 8px, transparent 16px)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '14%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.15)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  🏁
                </div>

                {/* Carro + card de info */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${animated ? trackPct : 4}%`,
                    transition: 'left 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    zIndex: 10,
                    animation: hasMoved ? 'engineRevUp 0.4s ease-in-out infinite' : 'none',
                    transform: 'translate(0, -50%)',
                  }}
                >
                  {/* Fumaça do escape — só se em movimento */}
                  {hasMoved && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '100%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        gap: 4,
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.18)',
                            animation: `exhaustSmoke 0.6s ease-out ${i * 0.15}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Emoji do carro */}
                  <div style={{ fontSize: 40, lineHeight: 1 }}>{car.emoji}</div>

                  {/* Card flutuante */}
                  <div
                    style={{
                      background: 'rgba(8,15,13,0.9)',
                      border: `1px solid ${isLeader ? 'rgba(0,196,180,0.4)' : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: 10,
                      padding: '8px 14px',
                      whiteSpace: 'nowrap',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: isLeader ? '#00c4b4' : '#ffffff',
                      }}
                    >
                      {seller.full_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      {car.name} · {seller.conversions}{' '}
                      {seller.conversions === 1 ? 'venda' : 'vendas'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna direita: placar */}
              <div
                style={{
                  width: 140,
                  textAlign: 'right',
                  padding: '0 24px 0 16px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: isLeader ? '#00c4b4' : 'rgba(255,255,255,0.5)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {seller.conversions}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                  {seller.conversions === 1 ? 'venda' : 'vendas'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          textAlign: 'center',
          padding: 16,
          fontSize: 12,
          color: 'rgba(255,255,255,0.18)',
          animation: 'pulse 3s ease-in-out infinite',
        }}
      >
        Atualização automática a cada 30 segundos
      </div>
    </div>
  )
}
