'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TrendingUp, Phone, Trophy, Medal, Star } from 'lucide-react'
import RoyalOakClock from '@/components/dashboard/RoyalOakClock'

type SellerRank = {
  id: string
  name: string
  converted: number
  proposta: number
  documentacao: number
  total: number
  score: number
}

type Simulation = {
  id: string
  client_name: string
  lance_percent: number
  lance_value: number
  probability: number
  seller_name: string | null
  created_at: string
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + i * 0.1)
      gain.gain.linearRampToValueAtTime(0.22, now + i * 0.1 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5)
      osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.51)
    })
  } catch { /* ignorado */ }
}

function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const letter = name.charAt(0).toUpperCase()
  const colors = ['#00D4C8', '#A78BFA', '#FFB547', '#FF5C5C', '#00A89D', '#F472B6']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${color}25`, border: `2px solid ${color}60`,
      fontSize: size * 0.4, fontWeight: 800, color,
    }}>
      {letter}
    </div>
  )
}

function PodiumCard({ seller, position, highlight }: { seller: SellerRank; position: number; highlight: boolean }) {
  const isFirst = position === 1
  const colors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }
  const icons = { 1: Trophy, 2: Medal, 3: Star }
  const color = colors[position as 1 | 2 | 3]
  const Icon = icons[position as 1 | 2 | 3]
  const heights = { 1: 200, 2: 160, 3: 140 }
  const height = heights[position as 1 | 2 | 3]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      animation: highlight ? 'pulse 0.6s ease' : 'none',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes shine { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Badge de posição */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <Icon size={isFirst ? 36 : 28} color={color} />
        <Avatar name={seller.name} size={isFirst ? 80 : 64} />
        <p style={{ fontSize: isFirst ? 20 : 16, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', maxWidth: 140 }}>
          {seller.name}
        </p>
      </div>

      {/* Pedestal */}
      <div style={{
        width: isFirst ? 180 : 150,
        height,
        borderRadius: '12px 12px 0 0',
        background: `linear-gradient(180deg, ${color}30, ${color}10)`,
        border: `2px solid ${color}50`,
        borderBottom: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: 16,
        boxShadow: isFirst ? `0 0 40px ${color}30` : 'none',
      }}>
        <p style={{ fontSize: isFirst ? 52 : 40, fontWeight: 900, color, lineHeight: 1 }}>
          {seller.converted}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>
          conversões
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,181,71,0.2)', color: '#FFB547', fontWeight: 700 }}>
            {seller.proposta} propostas
          </span>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
          padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)',
        }}>
          {seller.total} leads
        </div>
      </div>
    </div>
  )
}

export default function TvClient({ initialRanking }: { initialRanking: SellerRank[] }) {
  const [ranking, setRanking] = useState(initialRanking)
  const [clock, setClock] = useState(new Date())
  const [simAlert, setSimAlert] = useState<Simulation | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const lastCheck = useRef(new Date().toISOString())
  const seenIds = useRef<Set<string>>(new Set())
  const prevRanking = useRef<SellerRank[]>(initialRanking)

  // Relógio
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Atualiza ranking
  const fetchRanking = useCallback(async () => {
    try {
      const res = await fetch('/api/tv/ranking')
      const { ranking: newRanking } = await res.json() as { ranking: SellerRank[] }
      if (!newRanking?.length) return

      // Detecta quem subiu de posição para animar
      const prev = prevRanking.current
      newRanking.forEach((seller, newIdx) => {
        const prevIdx = prev.findIndex((s) => s.id === seller.id)
        if (prevIdx > newIdx) {
          setHighlightId(seller.id)
          setTimeout(() => setHighlightId(null), 2000)
        }
      })

      prevRanking.current = newRanking
      setRanking(newRanking)
    } catch { /* ignora */ }
  }, [])

  // Polling de simulações
  const pollSimulations = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications/unread?since=${encodeURIComponent(lastCheck.current)}`)
      const { notifications } = await res.json() as {
        notifications: Array<{ id: string; title: string; data: Record<string, unknown>; created_at: string }>
      }
      lastCheck.current = new Date().toISOString()

      const novos = notifications.filter((n) => !seenIds.current.has(n.id) && n.data?.lance_percent != null)
      if (!novos.length) return

      novos.forEach((n) => seenIds.current.add(n.id))
      const n = novos[0]
      playChime()
      setSimAlert({
        id: n.id,
        client_name: n.title.replace(' simulou um lance', ''),
        lance_percent: Number(n.data.lance_percent),
        lance_value: Number(n.data.lance_value),
        probability: Number(n.data.probability ?? 0),
        seller_name: (n.data.seller_name as string) || null,
        created_at: n.created_at,
      })
      setTimeout(() => setSimAlert(null), 8000)
      // Atualiza ranking após simulação (pode ter convertido)
      setTimeout(fetchRanking, 2000)
    } catch { /* ignora */ }
  }, [fetchRanking])

  useEffect(() => {
    const sim = setInterval(pollSimulations, 5000)
    const rank = setInterval(fetchRanking, 30000)
    return () => { clearInterval(sim); clearInterval(rank) }
  }, [pollSimulations, fetchRanking])

  // Top 3 e restante
  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  // Podium order: 2º | 1º | 3º
  const podiumOrder = [
    top3[1] ? { seller: top3[1], pos: 2 } : null,
    top3[0] ? { seller: top3[0], pos: 1 } : null,
    top3[2] ? { seller: top3[2], pos: 3 } : null,
  ].filter(Boolean) as Array<{ seller: SellerRank; pos: number }>

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#080f0e',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes alertIn { from{opacity:0;transform:translateX(120%)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: '1px solid rgba(0,212,200,0.15)',
        background: 'rgba(0,212,200,0.03)',
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>
            🏆 Plano G — Ranking de Vendedores
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Atualizado em tempo real</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              {clock.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <RoyalOakClock size={140} />
        </div>
      </div>

      {ranking.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <Trophy size={64} color="var(--text-muted)" />
          <p style={{ fontSize: 22, color: 'var(--text-muted)', fontWeight: 600 }}>Nenhum lead cadastrado ainda</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 40px', gap: 32 }}>

          {/* Pódio */}
          {podiumOrder.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 24 }}>
              {podiumOrder.map(({ seller, pos }) => (
                <PodiumCard
                  key={seller.id}
                  seller={seller}
                  position={pos}
                  highlight={highlightId === seller.id}
                />
              ))}
            </div>
          )}

          {/* Resto do ranking */}
          {rest.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 800, margin: '0 auto', width: '100%' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 4 }}>
                Demais posições
              </p>
              {rest.map((seller, idx) => (
                <div key={seller.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 20px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                  animation: `rowIn 0.4s ease ${idx * 0.05}s both`,
                  transition: 'all 0.3s ease',
                  boxShadow: highlightId === seller.id ? '0 0 20px rgba(0,212,200,0.3)' : 'none',
                }}>
                  <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-muted)', width: 36, textAlign: 'center' }}>
                    {idx + 4}
                  </p>
                  <Avatar name={seller.name} size={44} />
                  <p style={{ flex: 1, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{seller.name}</p>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{seller.converted}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>conversões</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#FFB547', lineHeight: 1 }}>{seller.proposta}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>propostas</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1 }}>{seller.total}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>leads</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alert de simulação — canto inferior direito */}
      {simAlert && (() => {
        const prob = simAlert.probability
        const color = prob >= 70 ? '#00D4C8' : prob >= 40 ? '#FFB547' : '#FF5C5C'
        return (
          <div style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 999, width: 380,
            borderRadius: 18, overflow: 'hidden',
            boxShadow: `0 12px 48px rgba(0,0,0,0.7), 0 0 0 2px ${color}50`,
            animation: 'alertIn 0.45s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <div style={{ height: 4, background: color }} />
            <div style={{ background: '#0f1e1d', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <TrendingUp size={20} color={color} />
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Nova simulação!</p>
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{simAlert.client_name}</p>
              {simAlert.seller_name && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Vendedor: {simAlert.seller_name}</p>
              )}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color }}>R$ {simAlert.lance_value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{simAlert.lance_percent.toFixed(1)}% do crédito</span>
                  <span style={{ fontSize: 11, color }}>· {prob}% de chance</span>
                </div>
              </div>
              <div style={{ borderRadius: 10, padding: '8px 12px', background: `${color}12`, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Phone size={13} color={color} />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {prob >= 70 ? '🔥 Alta chance! Entre em contato agora!' : prob >= 40 ? '⚡ Ligue agora e oriente o lance!' : '📞 Cliente aquecido! Fale com ele!'}
                </p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
