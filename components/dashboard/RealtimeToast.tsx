'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, X, Phone } from 'lucide-react'

type Toast = {
  id: string
  title: string
  body: string
  lance_percent: number | null
  probability: number | null
  lance_value: number | null
  for_manager: boolean
  seller_name: string | null
}

function playSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const now = ctx.currentTime

    const notes = [523.25, 659.25, 783.99] // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + i * 0.12)
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35)
      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.36)
    })
  } catch { /* ignora se bloqueado pelo browser */ }
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const prob = toast.probability
  const probColor = prob === null ? 'var(--accent)'
    : prob >= 70 ? '#00D4C8'
    : prob >= 40 ? '#F6AD55'
    : '#ff4757'

  const cta = prob !== null && prob >= 70
    ? '🔥 Alta chance! Entre em contato agora e feche o lance!'
    : prob !== null && prob >= 40
    ? '⚡ Chance moderada. Ligue agora e ajude-o a aumentar o lance!'
    : '📞 Cliente interessado! Contate agora e oriente a melhor estratégia.'

  return (
    <div style={{
      width: 340,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,212,200,0.3)',
      background: 'var(--bg-secondary)',
      animation: 'toastSlideIn 0.45s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      {/* Barra de progresso */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${probColor}, ${probColor}88)`, animation: 'toastProgress 8s linear forwards' }} />

      <div style={{ padding: '14px 14px 14px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: `${probColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={18} color={probColor} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {toast.title}
            </p>
            {toast.for_manager && toast.seller_name && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                Vendedor: {toast.seller_name}
              </p>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}
          >
            <X size={14} color="var(--text-muted)" />
          </button>
        </div>

        {/* Detalhes da simulação */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {toast.lance_percent !== null && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: `${probColor}15`, color: probColor,
            }}>
              {toast.lance_percent.toFixed(1)}% do crédito
            </span>
          )}
          {toast.lance_value !== null && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
            }}>
              R$ {Number(toast.lance_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
          {prob !== null && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: `${probColor}15`, color: probColor,
            }}>
              {prob}% chance
            </span>
          )}
        </div>

        {/* CTA */}
        <div style={{
          borderRadius: 10, padding: '10px 12px',
          background: 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Phone size={13} color={probColor} style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {cta}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RealtimeToast({ userId }: { userId: string }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'seller_notifications',
          filter: `seller_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as {
            id: string; title: string; body: string
            data: { lance_percent?: number; probability?: number; lance_value?: number; for_manager?: boolean; seller_name?: string }
          }

          const toast: Toast = {
            id: n.id,
            title: n.title,
            body: n.body,
            lance_percent: n.data?.lance_percent ?? null,
            probability: n.data?.probability ?? null,
            lance_value: n.data?.lance_value ?? null,
            for_manager: n.data?.for_manager ?? false,
            seller_name: n.data?.seller_name ?? null,
          }

          playSound()
          setToasts((prev) => [toast, ...prev].slice(0, 5))

          // Auto-dismiss após 8s
          setTimeout(() => dismiss(toast.id), 8000)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, dismiss])

  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(120%) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
        @keyframes toastProgress {
          from { transform: scaleX(1); transform-origin: left; }
          to   { transform: scaleX(0); transform-origin: left; }
        }
      `}</style>

      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: 'none',
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastCard toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  )
}
