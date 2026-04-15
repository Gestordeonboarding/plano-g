'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Target, Gift, Trophy, Flame } from 'lucide-react'

type RankedSeller = {
  id: string
  full_name: string | null
  avatar_url: string | null
  converted: number
  credit: number
  commission_earned: number
}

type Commission = { rate_percent: number; monthly_goal_leads: number; monthly_goal_credit: number } | null
type Prize = { prize_description: string; is_revealed: boolean } | null

interface Props {
  userId: string
  tenantId: string
  sellerName: string
  avatarUrl: string | null
  commission: Commission
  prize: Prize
  initialRanking: RankedSeller[]
  convertedCount: number
  creditSold: number
  commissionEarned: number
  currentMonth: string
}

const MEDALS = ['🥇', '🥈', '🥉']
const PODIUM_H = [90, 130, 60]
const PODIUM_COLORS = [
  { bg: 'rgba(192,192,192,0.15)', accent: '#C0C0C0', text: '#C0C0C0' },
  { bg: 'rgba(212,175,55,0.2)', accent: '#D4AF37', text: '#FFD700' },
  { bg: 'rgba(205,127,50,0.15)', accent: '#CD7F32', text: '#CD7F32' },
]

function Avatar({ url, name, size = 48, highlight = false }: { url: string | null; name: string | null; size?: number; highlight?: boolean }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return url
    ? <img src={url} alt={name || ''} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: highlight ? '3px solid var(--tenant-primary)' : 'none' }} />
    : <div style={{
        width: size, height: size, borderRadius: '50%',
        background: highlight ? 'linear-gradient(135deg, var(--tenant-primary), #7c3aed)' : 'rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0,
        border: highlight ? '3px solid var(--tenant-primary)' : 'none',
      }}>{initials}</div>
}

function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1200 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    const start = Date.now()
    const from = 0
    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (value - from) * ease))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, duration])
  if (prefix === 'R$') {
    const formatted = display.toLocaleString('pt-BR', { minimumFractionDigits: 0 })
    return <span>{prefix} {formatted}{suffix}</span>
  }
  return <span>{prefix}{display}{suffix}</span>
}

export default function SellerHomeClient({
  userId, tenantId, sellerName, avatarUrl, commission, prize,
  initialRanking, convertedCount, creditSold, commissionEarned, currentMonth,
}: Props) {
  const [ranking, setRanking] = useState<RankedSeller[]>(initialRanking)
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set())
  const prevRankRef = useRef<Record<string, number>>({})

  const firstName = sellerName.split(' ')[0] || 'você'
  const myRank = ranking.findIndex(s => s.id === userId) + 1
  const goalPct = commission?.monthly_goal_leads ? Math.min(100, Math.round((convertedCount / commission.monthly_goal_leads) * 100)) : 0
  const goalMet = goalPct >= 100
  const rankAhead = myRank > 1 ? ranking[myRank - 2] : null
  const diffToFirst = rankAhead ? rankAhead.converted - convertedCount : 0

  const fetchRanking = useCallback(async () => {
    const res = await fetch('/api/equipe/ranking')
    if (!res.ok) return
    const { ranking: raw } = await res.json()
    if (!raw) return

    const newRanking = raw as RankedSeller[]
    const changed = new Set<string>()
    newRanking.forEach((s, i) => {
      if (prevRankRef.current[s.id] !== undefined && prevRankRef.current[s.id] !== i) changed.add(s.id)
    })
    if (changed.size > 0) {
      setChangedIds(changed)
      setTimeout(() => setChangedIds(new Set()), 2500)
    }
    prevRankRef.current = Object.fromEntries(newRanking.map((s, i) => [s.id, i]))
    setRanking(newRanking)
  }, [])

  useEffect(() => {
    prevRankRef.current = Object.fromEntries(initialRanking.map((s, i) => [s.id, i]))
    const supabase = createClient()
    const channel = supabase.channel('seller-ranking')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, fetchRanking)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, fetchRanking)
      .subscribe()
    const interval = setInterval(fetchRanking, 30000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [fetchRanking, initialRanking])

  // Motivational message
  const motivMsg = myRank === 1
    ? { icon: '🏆', text: `Você lidera o ranking! Continue arrasando, ${firstName}!`, color: '#FFD700' }
    : myRank === 2
    ? { icon: '🔥', text: `Você está em 2º! Apenas ${diffToFirst} conversão${diffToFirst !== 1 ? 'ões' : ''} para o 1º lugar!`, color: '#F6AD55' }
    : myRank === 3
    ? { icon: '💪', text: `3º lugar! Você pode subir. Mais ${diffToFirst} conversão${diffToFirst !== 1 ? 'ões' : ''} para o 2º!`, color: '#CD7F32' }
    : myRank > 0
    ? { icon: '🎯', text: `Você está em ${myRank}º. ${rankAhead ? `${rankAhead.full_name?.split(' ')[0]} está à frente por ${diffToFirst} conversão${diffToFirst !== 1 ? 'ões' : ''}!` : 'Bora converter!'}`, color: 'var(--tenant-primary)' }
    : { icon: '🚀', text: `Bora começar, ${firstName}! Sua primeira conversão te coloca no ranking!`, color: 'var(--tenant-primary)' }

  return (
    <>
      <style>{`
        @keyframes riseUp { from{transform:scaleY(0);transform-origin:bottom} to{transform:scaleY(1);transform-origin:bottom} }
        @keyframes dropIn { from{opacity:0;transform:translateY(-20px) scale(0.85)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes goldGlow { 0%,100%{box-shadow:0 0 16px rgba(212,175,55,0.4)} 50%{box-shadow:0 0 32px rgba(212,175,55,0.7)} }
        @keyframes floatPhoto { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes flashGreen { 0%{background:rgba(0,212,200,0.25)} 100%{background:transparent} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        .fu1{animation:slideUp .4s ease .0s both} .fu2{animation:slideUp .4s ease .08s both}
        .fu3{animation:slideUp .4s ease .16s both} .fu4{animation:slideUp .4s ease .24s both}
        .fu5{animation:slideUp .4s ease .32s both}
        .podium-block{animation:riseUp .7s cubic-bezier(.22,1,.36,1) both}
        .podium-photo{animation:dropIn .5s cubic-bezier(.22,1,.36,1) .3s both}
        .photo-float{animation:floatPhoto 4s ease-in-out infinite}
        .gold-glow{animation:goldGlow 2.5s ease-in-out infinite}
        .rank-changed{animation:flashGreen 2s ease forwards}
        .commission-pulse{animation:pulse 2s ease-in-out 3}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Greeting */}
        <div className="fu1" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar url={avatarUrl} name={sellerName} size={44} highlight />
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Olá,</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{firstName}! {motivMsg.icon}</p>
          </div>
        </div>

        {/* Motivational message */}
        <div className="fu2" style={{ borderRadius: 12, padding: '12px 14px', background: `${motivMsg.color}15`, border: `1px solid ${motivMsg.color}30` }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: motivMsg.color }}>{motivMsg.text}</p>
        </div>

        {/* Commission + Stats */}
        <div className="fu3" style={{ borderRadius: 18, padding: '20px', background: 'linear-gradient(135deg, var(--tenant-primary) 0%, #7c3aed 100%)' }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Comissão do mês</p>
          <p className="commission-pulse" style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
            <AnimatedNumber value={commissionEarned} prefix="R$" duration={1400} />
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase' }}>Conversões</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{convertedCount}</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase' }}>Crédito vendido</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{formatCurrency(creditSold)}</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase' }}>Taxa</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{commission?.rate_percent ?? 0}%</p>
            </div>
          </div>
        </div>

        {/* Goal progress */}
        {commission && (
          <div className="fu3" style={{ borderRadius: 14, padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Target size={15} style={{ color: goalMet ? '#00D4C8' : 'var(--tenant-primary)' }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Sua meta do mês</p>
              {goalMet && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: '#00D4C8', padding: '2px 8px', borderRadius: 20, background: 'rgba(0,212,200,0.1)' }}>✓ Meta atingida!</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{convertedCount} de {commission.monthly_goal_leads} conversões</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: goalMet ? '#00D4C8' : 'var(--tenant-primary)' }}>{goalPct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: 'var(--bg-tertiary)' }}>
              <div style={{
                height: 8, borderRadius: 8,
                width: `${goalPct}%`,
                background: goalMet ? '#00D4C8' : 'linear-gradient(90deg, var(--tenant-primary), #7c3aed)',
                transition: 'width 0.8s cubic-bezier(.22,1,.36,1)',
              }} />
            </div>
          </div>
        )}

        {/* Prize */}
        {prize && (
          <div className="fu4" style={{
            borderRadius: 14, padding: '14px 16px',
            background: prize.is_revealed ? 'rgba(255,215,0,0.08)' : 'var(--bg-secondary)',
            border: prize.is_revealed ? '1px solid rgba(255,215,0,0.25)' : '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{prize.is_revealed ? '🎁' : '🔒'}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: prize.is_revealed ? '#FFD700' : 'var(--text-primary)' }}>
                  {prize.is_revealed ? 'Seu prêmio pela meta atingida!' : 'Prêmio secreto esperando por você'}
                </p>
                {prize.is_revealed
                  ? <p style={{ fontSize: 13, color: '#fff', marginTop: 2 }}>{prize.prize_description}</p>
                  : <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bata 100% da meta para desbloquear</p>
                }
              </div>
            </div>
          </div>
        )}

        {/* Podium */}
        <div className="fu5" style={{ borderRadius: 20, padding: '24px 16px 0', background: 'linear-gradient(160deg, #0a1628, #0d1f3c)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 28 }}>
            Ranking — {currentMonth.split('-').reverse().join('/')}
          </p>

          {ranking.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '20px 0' }}>Nenhuma conversão ainda</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
              {[ranking[1], ranking[0], ranking[2]].map((s, displayIdx) => {
                if (!s) return <div key={displayIdx} style={{ width: 100 }} />
                const rankIdx = displayIdx === 0 ? 1 : displayIdx === 1 ? 0 : 2
                const h = PODIUM_H[displayIdx]
                const pc = PODIUM_COLORS[rankIdx]
                const isMe = s.id === userId
                const isChanged = changedIds.has(s.id)
                return (
                  <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 100 }}>
                    {isChanged && <span style={{ fontSize: 10, fontWeight: 800, color: '#00D4C8', marginBottom: 4 }}>⬆ subiu!</span>}
                    <div className={`podium-photo ${rankIdx === 0 ? 'photo-float' : ''}`} style={{ marginBottom: 6, position: 'relative' }}>
                      <div className={rankIdx === 0 ? 'gold-glow' : ''} style={{ borderRadius: '50%', border: `3px solid ${isMe ? 'var(--tenant-primary)' : pc.accent}`, padding: 2 }}>
                        <Avatar url={s.avatar_url} name={s.full_name} size={rankIdx === 0 ? 62 : 48} highlight={isMe} />
                      </div>
                      {rankIdx === 0 && <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 18 }}>👑</span>}
                      {isMe && <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 14 }}>⭐</span>}
                    </div>
                    <p style={{ fontSize: rankIdx === 0 ? 12 : 10, fontWeight: 700, color: isMe ? 'var(--tenant-primary)' : pc.text, textAlign: 'center', marginBottom: 2, maxWidth: 95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isMe ? 'Você' : (s.full_name?.split(' ')[0] || '—')}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{s.converted} conv.</p>
                    <div className={`podium-block ${isChanged ? 'rank-changed' : ''}`} style={{
                      width: '100%', height: h, borderRadius: '8px 8px 0 0',
                      background: isMe ? 'rgba(0,212,200,0.2)' : pc.bg,
                      border: `1px solid ${isMe ? 'rgba(0,212,200,0.4)' : pc.accent + '44'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      animationDelay: `${displayIdx * 0.1}s`,
                    }}>
                      <span style={{ fontSize: rankIdx === 0 ? 26 : 20 }}>{MEDALS[rankIdx]}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: isMe ? '#00D4C8' : pc.text }}>{rankIdx + 1}º</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Full ranking list (compact) */}
          <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {ranking.map((s, i) => {
              const isMe = s.id === userId
              const isChanged = changedIds.has(s.id)
              return (
                <div key={s.id} className={isChanged ? 'rank-changed' : ''} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderBottom: i < ranking.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  background: isMe ? 'rgba(0,212,200,0.04)' : 'transparent',
                  transition: 'background 0.3s',
                }}>
                  <span style={{ fontSize: 14, width: 24, textAlign: 'center', flexShrink: 0 }}>{i < 3 ? MEDALS[i] : `${i + 1}º`}</span>
                  <Avatar url={s.avatar_url} name={s.full_name} size={30} highlight={isMe} />
                  <p style={{ flex: 1, fontSize: 12, fontWeight: isMe ? 800 : 500, color: isMe ? 'var(--tenant-primary)' : 'rgba(255,255,255,0.7)' }}>
                    {isMe ? 'Você' : (s.full_name?.split(' ')[0] || '—')}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: isMe ? '#00D4C8' : 'rgba(255,255,255,0.5)' }}>{s.converted} conv.</p>
                  {isChanged && <span style={{ fontSize: 10, color: '#00D4C8' }}>⬆</span>}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </>
  )
}
