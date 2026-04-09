'use client'

import { useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'

export interface AutomationRule {
  id: string
  name: string
  trigger: string
  message_template: string
  is_active: boolean
  created_at: string
}

const TRIGGER_OPTIONS = [
  { value: 'lead_novo', label: 'Lead novo cadastrado' },
  { value: 'status_contato_feito', label: 'Status → Contato feito' },
  { value: 'status_proposta_enviada', label: 'Status → Proposta enviada' },
  { value: 'status_documentacao', label: 'Status → Documentação' },
  { value: 'status_convertido', label: 'Status → Convertido' },
  { value: 'status_perdido', label: 'Status → Perdido' },
]

const TRIGGER_LABEL: Record<string, string> = Object.fromEntries(
  TRIGGER_OPTIONS.map((o) => [o.value, o.label])
)

const VARIABLES_HINT = [
  { var: '{{nome}}', desc: 'Nome do lead' },
  { var: '{{telefone}}', desc: 'Telefone' },
  { var: '{{credito}}', desc: 'Crédito desejado' },
  { var: '{{vendedor}}', desc: 'Nome do vendedor' },
]

const DEFAULT_MESSAGES: Record<string, string> = {
  lead_novo: 'Olá, {{nome}}! 👋\n\nSoubemos que você tem interesse em consórcio. Meu nome é {{vendedor}} e estou aqui para te ajudar a realizar esse sonho.\n\nPosso te apresentar as melhores opções? 😊',
  status_contato_feito: 'Olá, {{nome}}! Aqui é {{vendedor}}.\n\nFoi um prazer falar com você! Caso tenha dúvidas, estou à disposição.',
  status_proposta_enviada: 'Olá, {{nome}}! 📋\n\nAcabei de enviar sua proposta personalizada. Dê uma olhada e me diz o que achou!\n\nQualquer dúvida, estou por aqui.',
  status_documentacao: 'Olá, {{nome}}! ✅\n\nÓtima notícia — chegamos à etapa de documentação!\n\nVou te enviar a lista do que precisa em breve.',
  status_convertido: 'Parabéns, {{nome}}! 🎉\n\nSua cota de consórcio está confirmada. Bem-vindo(a) à família!\n\nEstou à disposição para qualquer dúvida.',
  status_perdido: 'Olá, {{nome}}.\n\nEntendemos que o momento não era ideal. Se mudar de ideia ou precisar de informações, estarei por aqui!\n\nUm abraço, {{vendedor}}.',
}

export default function AutomacoesClient({ initialRules, hasWhatsApp }: {
  initialRules: AutomationRule[]
  hasWhatsApp: boolean
}) {
  const [rules, setRules] = useState(initialRules)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', trigger: '', message_template: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function onTriggerChange(trigger: string) {
    setForm((f) => ({
      ...f,
      trigger,
      message_template: f.message_template || DEFAULT_MESSAGES[trigger] || '',
      name: f.name || (TRIGGER_LABEL[trigger] || ''),
    }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Erro ao criar'); return }
    setRules((r) => [data, ...r])
    setForm({ name: '', trigger: '', message_template: '' })
    setShowForm(false)
  }

  async function toggleActive(rule: AutomationRule) {
    const res = await fetch(`/api/automations/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rule.is_active }),
    })
    if (res.ok) {
      const updated = await res.json()
      setRules((r) => r.map((x) => x.id === rule.id ? updated : x))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta automação?')) return
    const res = await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    if (res.ok) setRules((r) => r.filter((x) => x.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      {!hasWhatsApp && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-3"
          style={{ backgroundColor: 'rgba(255,181,71,0.12)', color: '#FFB547', border: '1px solid rgba(255,181,71,0.3)' }}>
          <MessageCircle size={16} />
          WhatsApp não configurado. Acesse <strong>Configurações</strong> e adicione sua Evolution API para ativar o disparo automático.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Regras de automação</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Mensagens enviadas automaticamente quando um evento ocorre
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Nova regra
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card-pg p-5 flex flex-col gap-4"
          style={{ border: '1px solid var(--accent)', borderRadius: 12 }}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>Nova automação</h3>

          <Field label="Gatilho">
            <select className="input-pg" value={form.trigger} onChange={(e) => onTriggerChange(e.target.value)} required>
              <option value="">Selecione o evento...</option>
              {TRIGGER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Nome da regra">
            <input className="input-pg" placeholder="Ex: Boas-vindas ao novo lead"
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </Field>

          <Field label="Mensagem">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {VARIABLES_HINT.map((v) => (
                <button key={v.var} type="button"
                  onClick={() => setForm((f) => ({ ...f, message_template: f.message_template + v.var }))}
                  className="text-[10px] px-2 py-0.5 rounded font-mono"
                  style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}
                  title={v.desc}>
                  {v.var}
                </button>
              ))}
            </div>
            <textarea className="input-pg resize-none font-mono text-sm" rows={5}
              placeholder="Olá, {{nome}}! ..."
              value={form.message_template}
              onChange={(e) => setForm((f) => ({ ...f, message_template: e.target.value }))}
              required />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Use as variáveis acima para personalizar a mensagem automaticamente.
            </p>
          </Field>

          {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Salvando...' : 'Criar automação'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {rules.length === 0 && !showForm ? (
        <div className="card-pg p-10 text-center">
          <MessageCircle size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma automação criada ainda.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Crie regras para enviar mensagens WhatsApp automaticamente.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map((rule) => (
            <div key={rule.id} className="card-pg overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${rule.is_active ? '' : 'opacity-30'}`}
                  style={{ backgroundColor: rule.is_active ? 'var(--accent)' : 'var(--text-muted)' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{rule.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {TRIGGER_LABEL[rule.trigger] || rule.trigger}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(rule)} className="transition-opacity"
                    title={rule.is_active ? 'Desativar' : 'Ativar'}
                    style={{ color: rule.is_active ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {rule.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    {expandedId === rule.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button onClick={() => handleDelete(rule.id)}
                    className="transition-opacity hover:opacity-80"
                    style={{ color: 'var(--danger)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {expandedId === rule.id && (
                <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <p className="text-xs font-medium mb-2 mt-2" style={{ color: 'var(--text-muted)' }}>Mensagem:</p>
                  <pre className="text-xs whitespace-pre-wrap font-mono rounded-lg p-3"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    {rule.message_template}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Variáveis disponíveis */}
      <div className="card-pg p-4">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Variáveis disponíveis nas mensagens</p>
        <div className="grid grid-cols-2 gap-2">
          {VARIABLES_HINT.map((v) => (
            <div key={v.var} className="flex items-center gap-2">
              <code className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ backgroundColor: 'rgba(0,212,200,0.10)', color: 'var(--accent)' }}>
                {v.var}
              </code>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}
