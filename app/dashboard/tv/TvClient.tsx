'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TrendingUp, Users, UserCheck, Phone, Clock, Tv } from 'lucide-react'

type Lead = { status: string }
type Simulation = {
  id: string
  client_name: string
  lance_percent: number
  lance_value: number
  probability: number
  seller_name: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  novo: 'Novos',
  contato_feito: 'Contato feito',
  proposta_enviada: 'Proposta enviada',
  documentacao: 'Documentação',
  convertido: 'Convertidos',
  perdido: 'Perdidos',
}
const STATUS_COLOR: Record<string, string> = {
  novo: '#5A7A78',
  contato_feito: '#00A89D',
  proposta_enviada: '#A78BFA',
  documentacao: '#FFB547',
  convertido: '#00D4C8',
  perdido: '#FF5C5C',
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + i * 0.12)
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4)
      osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.41)
    })
  } catch { /* ignorado */ }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  return `${Math.floor(mins / 60)}h atrás`
}

export default function TvClient({ initialLeads, isManager }: { initialLeads: Lead[]; isManager: boolean }) {
  const [leads, setLeads] = useState(initialLeads)
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [clock, setClock] = useState(new Date())
  const [newAlert, setNewAlert] = useState<Simulation | null>(null)
  const lastCheck = useRef(new Date().toISOString())
  const seenIds = useRef<Set<string>>(new Set())

  // Relógio
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Polling de notificações
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications/unread?since=${encodeURIComponent(lastCheck.current)}`)
      const { notifications } = await res.json() as {
        notifications: Array<{ id: string; title: string; data: Record<string, unknown>; created_at: string }>
      }
      lastCheck.current = new Date().toISOString()

      const novos = notifications.filter((n) => !seenIds.current.has(n.id))
      if (novos.length === 0) return

      novos.forEach((n) => seenIds.current.add(n.id))

      const newSims: Simulation[] = novos
        .filter((n) => n.data?.lance_percent != null)
        .map((n) => ({
          id: n.id,
          client_name: n.title.replace(' simulou um lance', ''),
          lance_percent: Number(n.data.lance_percent),
          lance_value: Number(n.data.lance_value),
          probability: Number(n.data.probability ?? 0),
          seller_name: (n.data.seller_name as string) || null,
          created_at: n.created_at,
        }))

      if (newSims.length > 0) {
        playChime()
        setNewAlert(newSims[0])
        setTimeout(() => setNewAlert(null), 6000)
        setSimulations((prev) => [...newSims, ...prev].slice(0, 10))
      }
    } catch { /* ignora */ }
  }, [])

  useEffect(() => {
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [poll])

  // Métricas por status
  const byStatus = Object.keys(STATUS_LABEL).map((s) => ({
    key: s,
    label: STATUS_LABEL[s],
    count: leads.filter((l) => l.status === s).length,
    color: STATUS_COLOR[s],
  }))

  const total = leads.length
  const convertidos = leads.filter((l) => l.status === 'convertido').length

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', padding: '24px 32px', gap: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tv size={28} color="var(--accent)" />
          <div>
            <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>Plano G</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Painel em tempo real</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {clock.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {clock.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Métricas grandes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* Total */}
        <div style={{
          borderRadius: 16, padding: '20px 24px',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(0,212,200,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={26} color="var(--accent)" />
          </div>
          <div>
            <p style={{ fontSize: 40, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{total}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Total de leads</p>
          </div>
        </div>

        {/* Convertidos */}
        <div style={{
          borderRadius: 16, padding: '20px 24px',
          background: 'var(--bg-secondary)', border: '1px solid rgba(0,212,200,0.3)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(0,212,200,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={26} color="var(--accent)" />
          </div>
          <div>
            <p style={{ fontSize: 40, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{convertidos}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Convertidos</p>
          </div>
        </div>

        {/* Status cards */}
        {byStatus.filter((s) => !['convertido', 'perdido'].includes(s.key)).map((s) => (
          <div key={s.key} style={{
            borderRadius: 16, padding: '20px 24px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          }}>
            <p style={{ fontSize: 40, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.count}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Simulações recentes */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={20} color="var(--accent)" />
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Simulações recentes</p>
          {simulations.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>Aguardando simulações...</p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {simulations.map((s, idx) => {
            const prob = s.probability
            const color = prob >= 70 ? '#00D4C8' : prob >= 40 ? '#FFB547' : '#FF5C5C'
            return (
              <div key={s.id} style={{
                borderRadius: 14, padding: '16px 20px',
                background: idx === 0 ? `${color}0f` : 'var(--bg-secondary)',
                border: `1px solid ${idx === 0 ? `${color}40` : 'var(--border-color)'}`,
                display: 'flex', alignItems: 'center', gap: 20,
                animation: idx === 0 ? 'fadeIn 0.4s ease both' : 'none',
              }}>
                <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{s.client_name}</p>
                  {isManager && s.seller_name && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Vendedor: {s.seller_name}</p>
                  )}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 900, color }}>R$ {s.lance_value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.lance_percent.toFixed(1)}% do crédito</p>
                </div>

                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <p style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{prob}%</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>de chance</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', minWidth: 80, justifyContent: 'flex-end' }}>
                  <Clock size={13} />
                  <p style={{ fontSize: 12 }}>{timeAgo(s.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Alert pop-up de nova simulação */}
      {newAlert && (
        <div style={{
          position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, width: 440,
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          animation: 'popUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <style>{`@keyframes popUp { from{opacity:0;transform:translateX(-50%) scale(0.85)} to{opacity:1;transform:translateX(-50%) scale(1)} }`}</style>

          {(() => {
            const prob = newAlert.probability
            const color = prob >= 70 ? '#00D4C8' : prob >= 40 ? '#FFB547' : '#FF5C5C'
            return (
              <div style={{ background: 'var(--bg-secondary)', border: `2px solid ${color}` }}>
                <div style={{ height: 4, background: color }} />
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <TrendingUp size={22} color={color} />
                    <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Nova simulação!
                    </p>
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {newAlert.client_name}
                  </p>
                  {isManager && newAlert.seller_name && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Vendedor: {newAlert.seller_name}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color }}>R$ {newAlert.lance_value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{newAlert.lance_percent.toFixed(1)}% · {prob}% de chance</span>
                  </div>
                  <div style={{ borderRadius: 12, padding: '10px 14px', background: `${color}12`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={15} color={color} />
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {prob >= 70 ? '🔥 Entre em contato agora — alta chance de fechar!' : prob >= 40 ? '⚡ Ligue agora e ajude-o a aumentar o lance!' : '📞 Cliente aquecido! Oriente a melhor estratégia.'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
