'use client'

import { useState } from 'react'
import { Phone, Clock, User } from 'lucide-react'
import CallLogModal from '@/components/dashboard/CallLogModal'
import type { CallLog } from '@/types/database'

interface CallbackEntry extends CallLog {
  seller_name?: string | null
}

interface Props {
  callbacks: CallbackEntry[]
  currentUserId: string
  tenantId: string
}

export default function TodayCallbacksClient({ callbacks, currentUserId, tenantId }: Props) {
  const [activeCallback, setActiveCallback] = useState<CallbackEntry | null>(null)

  if (callbacks.length === 0) return null

  return (
    <>
      <div className="card-pg p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Clock size={15} style={{ color: '#A78BFA' }} />
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Retornos agendados para hoje
          </p>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-auto"
            style={{ backgroundColor: 'rgba(167,139,250,0.15)', color: '#A78BFA' }}
          >
            {callbacks.length}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {callbacks.map((cb) => {
            const time = cb.scheduled_callback_at
              ? new Date(cb.scheduled_callback_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'
            return (
              <div
                key={cb.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div
                  className="text-center px-3 py-2 rounded-lg shrink-0"
                  style={{
                    backgroundColor: 'rgba(167,139,250,0.12)',
                    color: '#A78BFA',
                    minWidth: 64,
                  }}
                >
                  <p className="text-base font-bold leading-none">{time}</p>
                  <p className="text-[9px] mt-1 opacity-70">hoje</p>
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {cb.contact_name}
                  </p>
                  <div
                    className="flex items-center gap-1 text-xs mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <User size={10} />
                    {cb.seller_name || 'Vendedor'}
                    {cb.contact_phone && <span> · {cb.contact_phone}</span>}
                  </div>
                </div>

                <button
                  onClick={() => setActiveCallback(cb)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium shrink-0"
                  style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}
                >
                  <Phone size={11} /> Registrar
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {activeCallback && (
        <CallLogModal
          isOpen={true}
          onClose={() => setActiveCallback(null)}
          onSuccess={() => {
            // Recarrega a página para refletir o novo registro e remover o card
            // (no callback anterior o scheduled_callback_at fica como histórico)
            window.location.reload()
          }}
          leadId={activeCallback.lead_id ?? undefined}
          consorciadoId={activeCallback.consorciado_id ?? undefined}
          contactName={activeCallback.contact_name}
          contactPhone={activeCallback.contact_phone}
          tenantId={tenantId}
          sellerId={currentUserId}
        />
      )}
    </>
  )
}
