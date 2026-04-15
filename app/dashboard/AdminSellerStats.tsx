'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Target, TrendingUp, Medal } from 'lucide-react'

type Commission = { rate_percent: number; monthly_goal_leads: number; monthly_goal_credit: number } | null

type RankedSeller = {
  id: string
  full_name: string | null
  converted: number
  credit: number
  commission_earned: number
}

interface Props {
  userId: string
  adminName: string
  commission: Commission
  convertedCount: number
  creditSold: number
  commissionEarned: number
  initialRanking: RankedSeller[]
  currentMonth: string
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function AdminSellerStats({
  userId, adminName, commission, convertedCount, creditSold,
  commissionEarned, initialRanking, currentMonth,
}: Props) {
  const [ranking, setRanking] = useState<RankedSeller[]>(initialRanking)
  const prevRankRef = useRef<Record<string, number>>({})

  const goalPct = commission?.monthly_goal_leads
    ? Math.min(100, Math.round((convertedCount / commission.monthly_goal_leads) * 100))
    : 0
  const goalMet = goalPct >= 100
  const myRank = ranking.findIndex(s => s.id === userId) + 1

  const fetchRanking = useCallback(async () => {
    const res = await fetch('/api/equipe/ranking')
    if (!res.ok) return
    const { ranking: raw } = await res.json()
    if (raw) setRanking(raw as RankedSeller[])
  }, [])

  useEffect(() => {
    prevRankRef.current = Object.fromEntries(initialRanking.map((s, i) => [s.id, i]))
    const interval = setInterval(fetchRanking, 30000)
    return () => clearInterval(interval)
  }, [fetchRanking, initialRanking])

  const firstName = adminName.split(' ')[0]

  return (
    <div className="card-pg p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          Suas vendas — {currentMonth.split('-').reverse().join('/')}
        </p>
        {myRank > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}>
            {myRank <= 3 ? MEDALS[myRank - 1] : `${myRank}º`} no ranking
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, var(--tenant-primary) 0%, #7c3aed 100%)' }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Comissão
          </p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 4 }}>
            {formatCurrency(commissionEarned)}
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            Taxa: {commission?.rate_percent ?? 0}%
          </p>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Conversões
          </p>
          <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
            {convertedCount}
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            este mês
          </p>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Crédito vendido
          </p>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
            {formatCurrency(creditSold)}
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            este mês
          </p>
        </div>
      </div>

      {/* Goal progress */}
      {commission && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={13} style={{ color: goalMet ? '#00D4C8' : 'var(--tenant-primary)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Meta: {convertedCount} / {commission.monthly_goal_leads} conversões
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: goalMet ? '#00D4C8' : 'var(--tenant-primary)' }}>
              {goalPct}%{goalMet ? ' ✓' : ''}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: 'var(--bg-tertiary)' }}>
            <div style={{
              height: 6, borderRadius: 6,
              width: `${goalPct}%`,
              background: goalMet ? '#00D4C8' : 'linear-gradient(90deg, var(--tenant-primary), #7c3aed)',
              transition: 'width 0.8s cubic-bezier(.22,1,.36,1)',
            }} />
          </div>
        </div>
      )}

      {/* Mini ranking */}
      {ranking.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Medal size={13} style={{ color: 'var(--accent)' }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Ranking do time
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ranking.slice(0, 5).map((s, i) => {
              const isMe = s.id === userId
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 8,
                  background: isMe ? 'rgba(0,212,200,0.08)' : 'transparent',
                  border: isMe ? '1px solid rgba(0,212,200,0.2)' : '1px solid transparent',
                }}>
                  <span style={{ fontSize: 13, width: 22, textAlign: 'center', flexShrink: 0 }}>
                    {i < 3 ? MEDALS[i] : `${i + 1}º`}
                  </span>
                  <p style={{ flex: 1, fontSize: 12, fontWeight: isMe ? 700 : 500, color: isMe ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {isMe ? `${firstName} (você)` : (s.full_name?.split(' ')[0] || '—')}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: isMe ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {s.converted} conv.
                  </p>
                </div>
              )
            })}
            {ranking.length > 5 && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 2 }}>
                +{ranking.length - 5} vendedor{ranking.length - 5 !== 1 ? 'es' : ''} no ranking completo
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
