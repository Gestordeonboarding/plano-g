'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  creditValue: number
  estimatedBalance: number
  history: Array<{ winning_bid_percentage: number | null; winning_bid_amount: number | null }>
}

export default function SimuladorClient({ creditValue, estimatedBalance, history }: Props) {
  const [lance, setLance] = useState('')

  function calcProbability(lanceValue: number): number {
    if (history.length === 0) return 0

    const percentages = history
      .map((h) => {
        if (h.winning_bid_percentage != null) return h.winning_bid_percentage / 100
        if (h.winning_bid_amount != null && creditValue > 0) return h.winning_bid_amount / creditValue
        return null
      })
      .filter((v): v is number => v !== null)

    if (percentages.length === 0) return 0

    const lancePercent = lanceValue / creditValue
    const wins = percentages.filter((p) => lancePercent >= p).length
    return Math.round((wins / percentages.length) * 100)
  }

  const lanceNum = parseFloat(lance.replace(/\D/g, '')) || 0
  const prob = lanceNum > 0 ? calcProbability(lanceNum) : null
  const minHistorico = history
    .map((h) => h.winning_bid_percentage)
    .filter((v): v is number => v !== null)
    .reduce((min, v) => Math.min(min, v), 100)

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
    >
      <div>
        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Saldo estimado disponível</p>
        <p className="text-xl font-bold" style={{ color: 'var(--tenant-primary)' }}>
          {formatCurrency(estimatedBalance)}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Valor que deseja ofertar como lance (R$)
        </label>
        <input
          type="number"
          className="input-pg text-lg"
          placeholder="0,00"
          value={lance}
          onChange={(e) => setLance(e.target.value)}
          min={0}
          max={creditValue}
        />
        {lanceNum > 0 && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {((lanceNum / creditValue) * 100).toFixed(1)}% do crédito
          </p>
        )}
      </div>

      {prob !== null && (
        <div
          className="rounded-xl p-4 text-center"
          style={{
            backgroundColor: prob >= 70 ? 'rgba(0,212,200,0.10)' : prob >= 40 ? 'rgba(255,181,71,0.10)' : 'rgba(255,92,92,0.10)',
          }}
        >
          <p className="text-4xl font-bold mb-1"
            style={{ color: prob >= 70 ? 'var(--accent)' : prob >= 40 ? '#FFB547' : 'var(--danger)' }}>
            {prob}%
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            de chance estimada com {formatCurrency(lanceNum)}
          </p>
          {history.length > 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Baseado nas últimas {history.length} assembleias · menor lance histórico: {minHistorico}%
            </p>
          )}
        </div>
      )}

      {lanceNum === 0 && (
        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          Digite um valor para ver sua chance estimada
        </p>
      )}
    </div>
  )
}
