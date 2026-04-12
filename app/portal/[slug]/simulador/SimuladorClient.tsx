'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, CheckCircle, ChevronRight } from 'lucide-react'

interface Props {
  consorciadoId: string
  slug: string
  creditValue: number
  estimatedBalance: number
  assetType: string | null
  nextAssemblyDate: string | null
  history: Array<{ winning_bid_percentage: number | null; winning_bid_amount: number | null }>
}

const STEPS = [25, 30, 35, 40, 50, 60, 70, 80]

export default function SimuladorClient({
  consorciadoId, slug, creditValue, estimatedBalance, assetType, nextAssemblyDate, history,
}: Props) {
  const [lancePercent, setLancePercent] = useState<number | null>(null)
  const [lanceCustom, setLanceCustom] = useState('')
  const [step, setStep] = useState<'choose' | 'result' | 'done'>('choose')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const percentages = history
    .map((h) => {
      if (h.winning_bid_percentage != null) return h.winning_bid_percentage
      if (h.winning_bid_amount != null && creditValue > 0) return (h.winning_bid_amount / creditValue) * 100
      return null
    })
    .filter((v): v is number => v !== null)

  const minHistorico = percentages.length > 0 ? Math.min(...percentages) : null
  const avgHistorico = percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : null

  function calcProb(pct: number): number {
    if (percentages.length === 0) return Math.min(Math.round(pct * 1.2), 95)
    const wins = percentages.filter((p) => pct >= p).length
    return Math.round((wins / percentages.length) * 100)
  }

  const selectedPct = lanceCustom
    ? parseFloat(lanceCustom.replace(',', '.')) || 0
    : lancePercent ?? 0

  const lanceValue = (selectedPct / 100) * creditValue
  const prob = selectedPct > 0 ? calcProb(selectedPct) : null

  const probColor = prob === null ? 'var(--text-muted)'
    : prob >= 70 ? '#00D4C8'
    : prob >= 40 ? '#F6AD55'
    : '#ff4757'

  const probLabel = prob === null ? '—'
    : prob >= 70 ? 'Alta chance'
    : prob >= 40 ? 'Chance moderada'
    : 'Baixa chance'

  async function handleSimular() {
    if (selectedPct <= 0) return
    setLoading(true)
    await fetch('/api/portal/simular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consorciado_id: consorciadoId,
        slug,
        lance_value: lanceValue,
        credit_value: creditValue,
        lance_percent: selectedPct,
        probability: prob,
      }),
    })
    setLoading(false)
    setSent(true)
    setStep('result')
  }

  if (step === 'result') {
    return (
      <>
        <style>{`
          @keyframes popIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
          .pop { animation: popIn 0.4s cubic-bezier(.22,1,.36,1) both; }
        `}</style>

        <div className="pop" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Resultado */}
          <div style={{
            borderRadius: 20, padding: '24px',
            background: `${probColor}10`,
            border: `1px solid ${probColor}30`,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
              Chance estimada de contemplação
            </p>
            <p style={{ fontSize: 64, fontWeight: 900, color: probColor, lineHeight: 1, marginBottom: 4 }}>
              {prob}%
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: probColor, marginBottom: 16 }}>{probLabel}</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '14px 0', borderTop: `1px solid ${probColor}20` }}>
              <div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lance</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(lanceValue)}</p>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Percentual</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedPct.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Mensagem motivacional */}
          <div style={{
            borderRadius: 14, padding: '14px 16px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          }}>
            {prob !== null && prob >= 70 ? (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: '#00D4C8' }}>Ótima escolha!</strong> Com esse lance você tem grandes chances na próxima assembleia. Fale com seu consultor para oficializar.
              </p>
            ) : prob !== null && prob >= 40 ? (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: '#F6AD55' }}>Chances moderadas.</strong> Considere aumentar um pouco o lance para melhorar sua posição. Fale com seu consultor.
              </p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: '#ff4757' }}>Lance abaixo do histórico.</strong> Aumente o percentual para ter mais chances. Consulte seu consultor para estratégias.
              </p>
            )}
          </div>

          {/* Botão nova simulação */}
          <button
            onClick={() => { setStep('choose'); setLancePercent(null); setLanceCustom(''); setSent(false) }}
            style={{
              padding: '14px', borderRadius: 14, fontWeight: 700, fontSize: 14,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Fazer outra simulação
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fu1{animation:fadeUp .4s ease .0s both} .fu2{animation:fadeUp .4s ease .08s both}
        .fu3{animation:fadeUp .4s ease .16s both} .fu4{animation:fadeUp .4s ease .24s both}
        .pct-btn { border-radius:12px; padding:12px 8px; border:1px solid var(--border-color);
          background:var(--bg-secondary); cursor:pointer; transition:all .15s; text-align:center; }
        .pct-btn:active { transform:scale(0.95); }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header info */}
        <div className="fu1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            display: 'flex', gap: 10,
          }}>
            <div style={{
              flex: 1, borderRadius: 14, padding: '14px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Crédito</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--tenant-primary)' }}>{formatCurrency(creditValue)}</p>
            </div>
            <div style={{
              flex: 1, borderRadius: 14, padding: '14px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Saldo est.</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(estimatedBalance)}</p>
            </div>
          </div>

          {minHistorico && (
            <div style={{
              borderRadius: 12, padding: '10px 14px',
              background: 'rgba(0,212,200,0.08)', border: '1px solid rgba(0,212,200,0.2)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <TrendingUp size={15} color="var(--tenant-primary)" />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Menor lance histórico: <strong style={{ color: 'var(--tenant-primary)' }}>{minHistorico.toFixed(0)}%</strong>
                {avgHistorico && <> · Média: <strong style={{ color: 'var(--tenant-primary)' }}>{avgHistorico}%</strong></>}
              </p>
            </div>
          )}
        </div>

        {/* Percentuais rápidos */}
        <div className="fu2">
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Escolha o percentual do lance
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {STEPS.map((pct) => {
              const val = (pct / 100) * creditValue
              const p = calcProb(pct)
              const pc = p >= 70 ? '#00D4C8' : p >= 40 ? '#F6AD55' : '#ff4757'
              const selected = lancePercent === pct && !lanceCustom
              return (
                <button
                  key={pct}
                  onClick={() => { setLancePercent(pct); setLanceCustom('') }}
                  className="pct-btn"
                  style={{
                    border: selected ? `1.5px solid var(--tenant-primary)` : '1px solid var(--border-color)',
                    background: selected ? 'rgba(0,212,200,0.08)' : 'var(--bg-secondary)',
                  }}
                >
                  <p style={{ fontSize: 15, fontWeight: 800, color: selected ? 'var(--tenant-primary)' : 'var(--text-primary)' }}>
                    {pct}%
                  </p>
                  <p style={{ fontSize: 9, color: pc, fontWeight: 700, marginTop: 2 }}>{p}%</p>
                  <p style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>
                    {formatCurrency(val).replace('R$\u00a0', 'R$ ')}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Valor personalizado */}
        <div className="fu3">
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Ou informe o percentual manualmente
          </p>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              placeholder="Ex: 45"
              value={lanceCustom}
              onChange={(e) => { setLanceCustom(e.target.value); setLancePercent(null) }}
              min={1} max={100}
              style={{
                width: '100%', borderRadius: 12, padding: '12px 48px 12px 14px',
                background: 'var(--bg-secondary)', border: `1px solid ${lanceCustom ? 'var(--tenant-primary)' : 'var(--border-color)'}`,
                color: 'var(--text-primary)', fontSize: 16, fontWeight: 700,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <span style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', fontWeight: 700, fontSize: 14,
            }}>%</span>
          </div>
          {lanceCustom && parseFloat(lanceCustom) > 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              = {formatCurrency((parseFloat(lanceCustom.replace(',', '.')) / 100) * creditValue)}
            </p>
          )}
        </div>

        {/* Preview resultado */}
        {selectedPct > 0 && prob !== null && (
          <div className="fu4" style={{
            borderRadius: 14, padding: '14px 16px',
            background: `${probColor}0d`, border: `1px solid ${probColor}25`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Com {selectedPct.toFixed(1)}% ({formatCurrency(lanceValue)})</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: probColor }}>{prob}% de chance · {probLabel}</p>
            </div>
            <ChevronRight size={18} color={probColor} />
          </div>
        )}

        {/* Botão simular */}
        <button
          onClick={handleSimular}
          disabled={selectedPct <= 0 || loading}
          style={{
            padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 15,
            background: selectedPct > 0 ? 'var(--tenant-primary)' : 'var(--bg-secondary)',
            color: selectedPct > 0 ? '#fff' : 'var(--text-muted)',
            border: 'none', cursor: selectedPct > 0 ? 'pointer' : 'not-allowed',
            opacity: loading ? 0.7 : 1, transition: 'all .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? 'Calculando...' : selectedPct > 0 ? (
            <><TrendingUp size={18} /> Ver resultado da simulação</>
          ) : 'Escolha um percentual acima'}
        </button>
      </div>
    </>
  )
}
