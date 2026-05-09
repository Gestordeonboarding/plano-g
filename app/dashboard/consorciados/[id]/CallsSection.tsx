'use client'

import { useState, useEffect, useCallback } from 'react'
import { Phone, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CallLogModal from '@/components/dashboard/CallLogModal'
import { OUTCOME_LABELS, OUTCOME_EMOJI, OUTCOME_COLORS } from '@/lib/calls'
import type { CallLog } from '@/types/database'

interface Props {
  consorciadoId: string
  tenantId: string
  contactName: string
  contactPhone?: string | null
}

export default function CallsSection({
  consorciadoId,
  tenantId,
  contactName,
  contactPhone,
}: Props) {
  const [open, setOpen] = useState(false)
  const [calls, setCalls] = useState<CallLog[]>([])
  const [sellerId, setSellerId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('call_logs')
      .select('*')
      .eq('consorciado_id', consorciadoId)
      .order('called_at', { ascending: false })
    if (data) setCalls(data as CallLog[])
  }, [consorciadoId])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setSellerId(user.id)
    })
    refresh()
  }, [refresh])

  return (
    <div className="card-pg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone size={14} style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Histórico de ligações
          </p>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
          >
            {calls.length}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}
        >
          <Phone size={12} /> Registrar ligação
        </button>
      </div>

      {calls.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Nenhuma ligação registrada.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {calls.map((c) => {
            const colors = OUTCOME_COLORS[c.outcome]
            return (
              <div
                key={c.id}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <span style={{ fontSize: 18 }}>{OUTCOME_EMOJI[c.outcome]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[11px] px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                        fontWeight: colors.bold ? 800 : 700,
                      }}
                    >
                      {OUTCOME_LABELS[c.outcome]}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(c.called_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {c.duration_minutes != null && (
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        · {c.duration_minutes} min
                      </span>
                    )}
                  </div>
                  {c.notes && (
                    <p
                      className="text-xs mt-1.5"
                      style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
                    >
                      {c.notes}
                    </p>
                  )}
                  {c.scheduled_callback_at && (
                    <div
                      className="flex items-center gap-1 text-[11px] mt-1.5 px-2 py-1 rounded w-fit"
                      style={{
                        backgroundColor: 'rgba(167,139,250,0.12)',
                        color: '#A78BFA',
                      }}
                    >
                      <Calendar size={11} /> Retorno agendado para{' '}
                      {new Date(c.scheduled_callback_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {sellerId && (
        <CallLogModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onSuccess={refresh}
          consorciadoId={consorciadoId}
          contactName={contactName}
          contactPhone={contactPhone}
          tenantId={tenantId}
          sellerId={sellerId}
        />
      )}
    </div>
  )
}
