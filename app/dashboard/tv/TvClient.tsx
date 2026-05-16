'use client'

/**
 * TvClient — orquestrador do Modo TV.
 *
 * Responsabilidades:
 *  - Polling do ranking a cada 30s (mantém dados frescos)
 *  - Polling de simulações a cada 5s (notifica alertas com chime)
 *  - Toggle manual entre Ranking ↔ Corrida (botões no topo)
 *  - Auto-alternância automática a cada 45s entre os dois modos
 *  - Relógio em tempo real no header
 *  - Alerta flutuante quando vendedor faz nova simulação
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, X } from 'lucide-react'
import { SellerRankingItem } from '@/lib/tv/getRanking'
import { RankingView } from '@/components/tv/RankingView'
import { RaceView } from '@/components/tv/RaceView'

type ViewMode = 'ranking' | 'race'

interface Simulation {
  id: string
  client_name: string
  lance_percent: number
  lance_value: number
  probability: number
  seller_name: string | null
  created_at: string
}

// ── Som de notificação (chime) — preservado do TvClient legado ──────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + i * 0.1)
      gain.gain.linearRampToValueAtTime(0.22, now + i * 0.1 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5)
      osc.start(now + i * 0.1)
      osc.stop(now + i * 0.1 + 0.51)
    })
  } catch {
    /* AudioContext indisponível — silencioso */
  }
}

export default function TvClient({ initialRanking }: { initialRanking: SellerRankingItem[] }) {
  const router = useRouter()
  const [ranking, setRanking] = useState<SellerRankingItem[]>(initialRanking)
  const [viewMode, setViewMode] = useState<ViewMode>('ranking')
  const [clock, setClock] = useState(new Date())
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [simAlert, setSimAlert] = useState<Simulation | null>(null)

  const lastCheck = useRef(new Date().toISOString())
  const seenSimIds = useRef<Set<string>>(new Set())

  // ── Sair do Modo TV (botão ou tecla ESC) ──────────────────────────────────
  const exitTvMode = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        exitTvMode()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exitTvMode])

  // ── Relógio em tempo real ─────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Fetch do ranking ──────────────────────────────────────────────────────
  const fetchRanking = useCallback(async () => {
    try {
      const res = await fetch('/api/tv/ranking', { cache: 'no-store' })
      const { ranking: data } = (await res.json()) as { ranking: SellerRankingItem[] }
      if (data) {
        setRanking(data)
        setLastUpdate(new Date())
      }
    } catch {
      /* falha silenciosa — próxima tentativa em 30s */
    }
  }, [])

  // ── Polling de simulações (alerta com chime) ──────────────────────────────
  const pollSimulations = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications/unread?since=${encodeURIComponent(lastCheck.current)}`)
      const { notifications } = (await res.json()) as {
        notifications: Array<{ id: string; title: string; data: Record<string, unknown>; created_at: string }>
      }
      lastCheck.current = new Date().toISOString()

      const novos = notifications.filter(
        (n) => !seenSimIds.current.has(n.id) && n.data?.lance_percent != null,
      )
      if (novos.length === 0) return

      novos.forEach((n) => seenSimIds.current.add(n.id))
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
      // Re-busca ranking após simulação (pode ter rolado conversão)
      setTimeout(fetchRanking, 2000)
    } catch {
      /* ignora */
    }
  }, [fetchRanking])

  // ── Intervalos: ranking 30s + simulações 5s ───────────────────────────────
  useEffect(() => {
    const rank = setInterval(fetchRanking, 30_000)
    const sim = setInterval(pollSimulations, 5_000)
    return () => {
      clearInterval(rank)
      clearInterval(sim)
    }
  }, [fetchRanking, pollSimulations])

  // ── Auto-alternância Ranking ↔ Corrida a cada 45s ─────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      setViewMode((prev) => (prev === 'ranking' ? 'race' : 'ranking'))
    }, 45_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#080f0d',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header fixo */}
      <div
        style={{
          height: 88,
          background: 'rgba(8,15,13,0.92)',
          borderBottom: '1px solid rgba(0,196,180,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          flexShrink: 0,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Esquerda: título */}
        <div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#00c4b4',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              marginBottom: 2,
            }}
          >
            🏆 Ranking de Vendedores
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Centro: toggle de modo */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ModeButton active={viewMode === 'ranking'} onClick={() => setViewMode('ranking')}>
            🏆 Ranking
          </ModeButton>
          <ModeButton active={viewMode === 'race'} onClick={() => setViewMode('race')}>
            🏎️ Corrida
          </ModeButton>
        </div>

        {/* Direita: relógio + sair */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: '#ffffff',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {clock.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              {clock.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>

          {/* Botão de saída — volta pro dashboard */}
          <button
            onClick={exitTvMode}
            title="Sair do Modo TV (ESC)"
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(226,75,74,0.15)'
              e.currentTarget.style.borderColor = 'rgba(226,75,74,0.4)'
              e.currentTarget.style.color = '#e24b4a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Conteúdo (Ranking ou Race) */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {viewMode === 'ranking' ? (
          <RankingView sellers={ranking} />
        ) : (
          <RaceView sellers={ranking} />
        )}
      </div>

      {/* Alerta de nova simulação */}
      {simAlert && (
        <div
          style={{
            position: 'fixed',
            top: 100,
            right: 24,
            zIndex: 9999,
            background: 'rgba(0,196,180,0.95)',
            color: '#080f0d',
            borderRadius: 12,
            padding: '16px 20px',
            minWidth: 320,
            boxShadow: '0 12px 48px rgba(0,196,180,0.3)',
            animation: 'alertIn 0.4s ease both',
          }}
        >
          <style>{`@keyframes alertIn { from{opacity:0;transform:translateX(120%)} to{opacity:1;transform:translateX(0)} }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <TrendingUp size={16} />
            <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Nova simulação
            </span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{simAlert.client_name}</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            Lance de {simAlert.lance_percent}% ·{' '}
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
            }).format(simAlert.lance_value)}
          </div>
          {simAlert.seller_name && (
            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 6 }}>por {simAlert.seller_name}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Botão de modo (Ranking/Corrida) ─────────────────────────────────────────
function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 18px',
        borderRadius: 8,
        border: `1px solid ${active ? '#00c4b4' : 'rgba(255,255,255,0.1)'}`,
        background: active ? 'rgba(0,196,180,0.15)' : 'transparent',
        color: active ? '#00c4b4' : 'rgba(255,255,255,0.45)',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}
