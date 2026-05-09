'use client'

import { useState, useEffect } from 'react'
import { X, Phone, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CallOutcome } from '@/types/database'
import { OUTCOME_LABELS, OUTCOME_EMOJI } from '@/lib/calls'

interface CallLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  leadId?: string
  consorciadoId?: string
  contactName: string
  contactPhone?: string | null
  tenantId: string
  sellerId: string
}

const OUTCOMES: CallOutcome[] = [
  'atendeu',
  'nao_atendeu',
  'caixa_postal',
  'numero_errado',
  'agendou_reuniao',
  'proposta_enviada',
  'venda_realizada',
  'nao_tem_interesse',
]

export function CallLogModal({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  consorciadoId,
  contactName,
  contactPhone,
  tenantId,
  sellerId,
}: CallLogModalProps) {
  const supabase = createClient()
  const [outcome, setOutcome] = useState<CallOutcome | ''>('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [callbackAt, setCallbackAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setOutcome('')
      setDuration('')
      setNotes('')
      setCallbackAt('')
      setError(null)
    }
  }, [isOpen])

  // ESC fecha
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  const needsCallback = outcome === 'nao_atendeu' || outcome === 'caixa_postal'
  const needsDuration =
    outcome === 'atendeu' ||
    outcome === 'agendou_reuniao' ||
    outcome === 'proposta_enviada' ||
    outcome === 'venda_realizada'

  async function handleSubmit() {
    if (!outcome) return
    setLoading(true)
    setError(null)
    try {
      const { error: dbErr } = await supabase.from('call_logs').insert({
        tenant_id: tenantId,
        seller_id: sellerId,
        lead_id: leadId ?? null,
        consorciado_id: consorciadoId ?? null,
        contact_name: contactName,
        contact_phone: contactPhone ?? null,
        called_at: new Date().toISOString(),
        duration_minutes: duration ? parseInt(duration, 10) : null,
        outcome,
        notes: notes.trim() || null,
        scheduled_callback_at: callbackAt ? new Date(callbackAt).toISOString() : null,
      })
      if (dbErr) throw new Error(dbErr.message)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar ligação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-start justify-between"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(0,212,200,0.15)' }}
            >
              <Phone size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Registrar ligação
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {contactName}
                {contactPhone && (
                  <span style={{ color: 'var(--text-muted)' }}> · {contactPhone}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            <X size={15} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Body */}
        <div
          className="px-5 py-5 flex flex-col gap-4 overflow-y-auto"
          style={{ maxHeight: '70vh' }}
        >
          {/* Outcome */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Resultado <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map((o) => {
                const selected = outcome === o
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOutcome(o)}
                    className="text-left text-xs px-3 py-2.5 rounded-lg transition-all flex items-center gap-2"
                    style={{
                      border: selected
                        ? '1.5px solid var(--accent)'
                        : '1.5px solid var(--border-color)',
                      backgroundColor: selected
                        ? 'rgba(0,212,200,0.08)'
                        : 'var(--bg-tertiary)',
                      color: selected ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: selected ? 600 : 500,
                    }}
                  >
                    <span>{OUTCOME_EMOJI[o]}</span>
                    <span>{OUTCOME_LABELS[o]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Duração — quando atendeu */}
          {needsDuration && (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
              <label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Duração (minutos)
              </label>
              <input
                type="number"
                min={1}
                className="input-pg text-sm"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 15"
              />
            </div>
          )}

          {/* Retorno — quando não atendeu */}
          {needsCallback && (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
              <label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Agendar retorno
              </label>
              <input
                type="datetime-local"
                className="input-pg text-sm"
                value={callbackAt}
                onChange={(e) => setCallbackAt(e.target.value)}
              />
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Aparece como lembrete na home no dia agendado
              </p>
            </div>
          )}

          {/* Notas */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Anotação
            </label>
            <textarea
              className="input-pg text-sm resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que foi conversado, próximos passos..."
            />
          </div>

          {error && (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(255,92,92,0.10)', color: 'var(--danger)' }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex justify-end gap-2"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-outline text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !outcome}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar ligação'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CallLogModal
