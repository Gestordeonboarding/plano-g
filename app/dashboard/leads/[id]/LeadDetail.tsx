'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Send, Phone, Calendar } from 'lucide-react'
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import CallLogModal from '@/components/dashboard/CallLogModal'
import { OUTCOME_LABELS, OUTCOME_EMOJI, OUTCOME_COLORS } from '@/lib/calls'
import type { CallLog } from '@/types/database'

const STATUS_OPTIONS = [
  { value: 'novo', label: 'Novo' },
  { value: 'contato_feito', label: 'Contato feito' },
  { value: 'proposta_enviada', label: 'Proposta enviada' },
  { value: 'documentacao', label: 'Documentação' },
  { value: 'convertido', label: 'Convertido' },
  { value: 'perdido', label: 'Perdido' },
]

const ASSET_LABEL: Record<string, string> = {
  imovel: 'Imóvel', auto: 'Auto', moto: 'Moto', servicos: 'Serviços', outros: 'Outros'
}

interface Lead {
  id: string; full_name: string; phone: string; email: string | null
  desired_credit: number | null; asset_type: string | null; monthly_income: number | null
  qualification_score: number; status: string; source: string; notes: string | null
  lost_reason: string | null; created_at: string; tenant_id: string; seller_id: string | null
}

export default function LeadDetail({ lead: initialLead, sellers }: {
  lead: Record<string, unknown>
  sellers: Record<string, unknown>[]
}) {
  const lead = initialLead as unknown as Lead
  const router = useRouter()
  const [status, setStatus] = useState(lead.status)

  // Ligações
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [calls, setCalls] = useState<CallLog[]>([])
  const [currentSellerId, setCurrentSellerId] = useState<string | null>(null)

  const refreshCalls = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('call_logs')
      .select('*')
      .eq('lead_id', lead.id)
      .order('called_at', { ascending: false })
    if (data) setCalls(data as CallLog[])
  }, [lead.id])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentSellerId(user.id)
    })
    refreshCalls()
  }, [refreshCalls])
  const [notes, setNotes] = useState(lead.notes || '')
  const [lostReason, setLostReason] = useState(lead.lost_reason || '')
  const [saving, setSaving] = useState(false)
  const [showConvert, setShowConvert] = useState(false)
  const [showWA, setShowWA] = useState(false)
  const [waMessage, setWaMessage] = useState('')
  const [waSending, setWaSending] = useState(false)
  const [waResult, setWaResult] = useState<'ok' | 'error' | null>(null)
  const [convertForm, setConvertForm] = useState({
    credit_value: String(lead.desired_credit || ''),
    group_number: '', quota_number: '', total_installments: '',
    monthly_installment: '', administrator: '',
  })

  async function saveStatus(newStatus: string) {
    setStatus(newStatus)
    const supabase = createClient()
    await supabase.from('leads').update({ status: newStatus, last_contact_at: new Date().toISOString() }).eq('id', lead.id)
    // Dispara automação WhatsApp se houver regra para esse gatilho
    triggerAutomation(`status_${newStatus}`)
  }

  async function triggerAutomation(trigger: string) {
    try {
      await fetch('/api/automations/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger, lead_id: lead.id }),
      })
    } catch { /* silencioso — automação é best-effort */ }
  }

  async function sendWhatsApp(e: React.FormEvent) {
    e.preventDefault()
    if (!waMessage.trim()) return
    setWaSending(true)
    setWaResult(null)
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: lead.phone, message: waMessage, lead_id: lead.id }),
    })
    setWaSending(false)
    setWaResult(res.ok ? 'ok' : 'error')
    if (res.ok) { setWaMessage(''); setTimeout(() => { setWaResult(null); setShowWA(false) }, 2000) }
  }

  async function saveNotes() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('leads').update({ notes, lost_reason: lostReason || null }).eq('id', lead.id)
    setSaving(false)
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('consorciados').insert({
      tenant_id: lead.tenant_id,
      seller_id: lead.seller_id || user.id,
      lead_id: lead.id,
      full_name: lead.full_name,
      phone: lead.phone,
      email: lead.email,
      credit_value: Number(convertForm.credit_value),
      group_number: convertForm.group_number || null,
      quota_number: convertForm.quota_number || null,
      total_installments: convertForm.total_installments ? Number(convertForm.total_installments) : null,
      monthly_installment: convertForm.monthly_installment ? Number(convertForm.monthly_installment) : null,
      administrator: convertForm.administrator || null,
      status: 'ativo',
    })

    await supabase.from('leads').update({ status: 'convertido' }).eq('id', lead.id)
    router.push('/dashboard/consorciados')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="card-pg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{lead.full_name}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {formatPhone(lead.phone)}
              {lead.email && <> · {lead.email}</>}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Score de qualificação</p>
            <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{lead.qualification_score}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {lead.asset_type && <Pill>{ASSET_LABEL[lead.asset_type]}</Pill>}
          {lead.desired_credit && <Pill color="yellow">{formatCurrency(lead.desired_credit)}</Pill>}
          {lead.monthly_income && <Pill>Renda: {formatCurrency(lead.monthly_income)}</Pill>}
          <Pill color="muted">Origem: {lead.source}</Pill>
          <Pill color="muted">Desde {formatDate(lead.created_at)}</Pill>
        </div>

        {/* Ações rápidas */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setCallModalOpen(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}
          >
            <Phone size={14} /> Registrar ligação
          </button>
        </div>
      </div>

      {/* WhatsApp manual */}
      <div className="card-pg p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle size={15} style={{ color: '#25D366' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>WhatsApp</p>
          </div>
          <button onClick={() => setShowWA((v) => !v)} className="btn-outline text-sm">
            {showWA ? 'Fechar' : 'Enviar mensagem'}
          </button>
        </div>

        {showWA && (
          <form onSubmit={sendWhatsApp} className="flex flex-col gap-3 mt-1">
            <textarea className="input-pg resize-none text-sm" rows={4}
              placeholder={`Olá, ${lead.full_name}! ...`}
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
              required />
            {waResult === 'ok' && (
              <p className="text-sm" style={{ color: 'var(--accent)' }}>✓ Mensagem enviada!</p>
            )}
            {waResult === 'error' && (
              <p className="text-sm" style={{ color: 'var(--danger)' }}>
                Falha ao enviar. Verifique as configurações do WhatsApp em Configurações.
              </p>
            )}
            <button type="submit" disabled={waSending}
              className="btn-primary text-sm w-fit flex items-center gap-2 disabled:opacity-50">
              <Send size={14} />
              {waSending ? 'Enviando...' : 'Enviar via WhatsApp'}
            </button>
          </form>
        )}
      </div>

      {/* Status */}
      <div className="card-pg p-5">
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => saveStatus(opt.value)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all border"
              style={status === opt.value
                ? { backgroundColor: 'var(--accent)', color: 'var(--bg-primary)', borderColor: 'var(--accent)' }
                : { backgroundColor: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Histórico de ligações */}
      {calls.length > 0 && (
        <div className="card-pg p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Phone size={14} style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Histórico de ligações
            </p>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-auto"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
            >
              {calls.length}
            </span>
          </div>
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
                        className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
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
        </div>
      )}

      {/* Modal de registrar ligação */}
      {currentSellerId && (
        <CallLogModal
          isOpen={callModalOpen}
          onClose={() => setCallModalOpen(false)}
          onSuccess={refreshCalls}
          leadId={lead.id}
          contactName={lead.full_name}
          contactPhone={lead.phone}
          tenantId={lead.tenant_id}
          sellerId={currentSellerId}
        />
      )}

      {/* Notas */}
      <div className="card-pg p-5 flex flex-col gap-3">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Notas internas</p>
        <textarea
          className="input-pg resize-none"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotações sobre o lead..."
        />
        {status === 'perdido' && (
          <>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Motivo da perda</p>
            <input className="input-pg" value={lostReason}
              onChange={(e) => setLostReason(e.target.value)} placeholder="Ex: Preferiu financiamento" />
          </>
        )}
        <button onClick={saveNotes} disabled={saving} className="btn-primary text-sm w-fit disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar notas'}
        </button>
      </div>

      {/* Converter */}
      {status !== 'perdido' && (
        <div className="card-pg p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Converter em consorciado</p>
            <button onClick={() => setShowConvert(!showConvert)} className="btn-outline text-sm">
              {showConvert ? 'Cancelar' : '+ Converter'}
            </button>
          </div>

          {showConvert && (
            <form onSubmit={handleConvert} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor do crédito *">
                  <input type="number" className="input-pg" required
                    value={convertForm.credit_value}
                    onChange={(e) => setConvertForm((f) => ({ ...f, credit_value: e.target.value }))} />
                </Field>
                <Field label="Administradora">
                  <input className="input-pg" value={convertForm.administrator}
                    onChange={(e) => setConvertForm((f) => ({ ...f, administrator: e.target.value }))}
                    placeholder="Ex: Embracon" />
                </Field>
                <Field label="Nº do grupo">
                  <input className="input-pg" value={convertForm.group_number}
                    onChange={(e) => setConvertForm((f) => ({ ...f, group_number: e.target.value }))} />
                </Field>
                <Field label="Nº da cota">
                  <input className="input-pg" value={convertForm.quota_number}
                    onChange={(e) => setConvertForm((f) => ({ ...f, quota_number: e.target.value }))} />
                </Field>
                <Field label="Total de parcelas">
                  <input type="number" className="input-pg" value={convertForm.total_installments}
                    onChange={(e) => setConvertForm((f) => ({ ...f, total_installments: e.target.value }))} />
                </Field>
                <Field label="Parcela mensal (R$)">
                  <input type="number" className="input-pg" value={convertForm.monthly_installment}
                    onChange={(e) => setConvertForm((f) => ({ ...f, monthly_installment: e.target.value }))} />
                </Field>
              </div>
              <button type="submit" className="btn-primary text-sm w-fit">
                Confirmar conversão
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function Pill({ children, color }: { children: React.ReactNode; color?: 'yellow' | 'muted' }) {
  const styles = {
    yellow: { backgroundColor: 'rgba(255,181,71,0.15)', color: '#FFB547' },
    muted: { backgroundColor: 'rgba(176,196,195,0.10)', color: 'var(--text-muted)' },
    default: { backgroundColor: 'rgba(0,212,200,0.10)', color: 'var(--accent)' },
  }
  const s = styles[color || 'default']
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={s}>
      {children}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}
