'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, X, Check } from 'lucide-react'

type Consorciado = {
  id: string
  full_name: string
  cpf: string | null
  phone: string | null
  email: string | null
  credit_value: number
  group_number: string | null
  quota_number: string | null
  administrator: string | null
  total_installments: number | null
  installments_paid: number
  monthly_installment: number | null
  next_assembly_date: string | null
  status: string
}

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'contemplado', label: 'Contemplado' },
  { value: 'inadimplente', label: 'Inadimplente' },
  { value: 'cancelado', label: 'Cancelado' },
]

export default function EditConsorciado({ con }: { con: Consorciado }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: con.full_name,
    cpf: con.cpf || '',
    phone: con.phone || '',
    email: con.email || '',
    credit_value: String(con.credit_value || ''),
    group_number: con.group_number || '',
    quota_number: con.quota_number || '',
    administrator: con.administrator || '',
    total_installments: String(con.total_installments || ''),
    installments_paid: String(con.installments_paid || 0),
    monthly_installment: String(con.monthly_installment || ''),
    next_assembly_date: con.next_assembly_date || '',
    status: con.status,
  })

  function set(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.full_name.trim()) {
      setError('Nome é obrigatório.')
      return
    }
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/consorciados/${con.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name.trim(),
        cpf: form.cpf.replace(/\D/g, '') || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        credit_value: form.credit_value ? Number(form.credit_value) : null,
        group_number: form.group_number.trim() || null,
        quota_number: form.quota_number.trim() || null,
        administrator: form.administrator.trim() || null,
        total_installments: form.total_installments ? Number(form.total_installments) : null,
        installments_paid: form.installments_paid ? Number(form.installments_paid) : 0,
        monthly_installment: form.monthly_installment ? Number(form.monthly_installment) : null,
        next_assembly_date: form.next_assembly_date || null,
        status: form.status,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erro ao salvar.')
    } else {
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-outline text-xs flex items-center gap-1.5"
      >
        <Edit2 size={13} /> Editar
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 20,
            width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflowY: 'auto',
            padding: 28,
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Editar consorciado
              </p>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Dados pessoais */}
            <Section title="Dados pessoais">
              <Field label="Nome completo *">
                <input className="input-pg" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="CPF">
                  <input className="input-pg" placeholder="000.000.000-00" value={form.cpf}
                    onChange={e => set('cpf', e.target.value)} />
                </Field>
                <Field label="Telefone">
                  <input className="input-pg" placeholder="(00) 00000-0000" value={form.phone}
                    onChange={e => set('phone', e.target.value)} />
                </Field>
              </div>
              <Field label="E-mail">
                <input className="input-pg" type="email" value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </Field>
            </Section>

            {/* Dados do consórcio */}
            <Section title="Dados do consórcio">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Grupo">
                  <input className="input-pg" placeholder="ex: 1234" value={form.group_number}
                    onChange={e => set('group_number', e.target.value)} />
                </Field>
                <Field label="Cota">
                  <input className="input-pg" placeholder="ex: 056" value={form.quota_number}
                    onChange={e => set('quota_number', e.target.value)} />
                </Field>
              </div>
              <Field label="Administradora">
                <input className="input-pg" placeholder="ex: Embracon, Porto Seguro..." value={form.administrator}
                  onChange={e => set('administrator', e.target.value)} />
              </Field>
              <Field label="Valor do crédito (R$)">
                <input className="input-pg" type="number" value={form.credit_value}
                  onChange={e => set('credit_value', e.target.value)} />
              </Field>
            </Section>

            {/* Parcelas */}
            <Section title="Parcelas">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Total de parcelas">
                  <input className="input-pg" type="number" value={form.total_installments}
                    onChange={e => set('total_installments', e.target.value)} />
                </Field>
                <Field label="Pagas">
                  <input className="input-pg" type="number" min="0" value={form.installments_paid}
                    onChange={e => set('installments_paid', e.target.value)} />
                </Field>
                <Field label="Parcela mensal (R$)">
                  <input className="input-pg" type="number" value={form.monthly_installment}
                    onChange={e => set('monthly_installment', e.target.value)} />
                </Field>
              </div>
            </Section>

            {/* Status e assembleia */}
            <Section title="Status e assembleia">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Status">
                  <select className="input-pg" value={form.status} onChange={e => set('status', e.target.value)}>
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Próx. assembleia">
                  <input className="input-pg" type="date" value={form.next_assembly_date}
                    onChange={e => set('next_assembly_date', e.target.value)} />
                </Field>
              </div>
            </Section>

            {error && (
              <p style={{ fontSize: 13, color: 'var(--danger)', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,92,92,0.1)' }}>
                {error}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)} className="btn-outline text-sm">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
                <Check size={14} />
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}
