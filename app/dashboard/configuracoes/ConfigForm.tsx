'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Tenant {
  id: string; name: string; slug: string; primary_color: string | null
}

export default function ConfigForm({ tenant }: { tenant: Record<string, unknown> }) {
  const t = tenant as unknown as Tenant
  const [form, setForm] = useState({
    name: t.name,
    primary_color: t.primary_color || '#00D4C8',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('tenants').update(form).eq('id', t.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwSaving(true)
    const supabase = createClient()
    await supabase.auth.updateUser({ password: newPassword })
    setNewPassword('')
    setPwSaving(false)
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Dados do escritório */}
      <form onSubmit={handleSave} className="card-pg p-6 flex flex-col gap-4">
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Dados do escritório</h2>
        <Field label="Nome do escritório">
          <input className="input-pg" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </Field>
        <Field label="Slug (URL do portal — não editável)">
          <input className="input-pg opacity-50 cursor-not-allowed" value={t.slug} readOnly />
        </Field>
        <Field label="Cor principal">
          <div className="flex items-center gap-3">
            <input type="color" value={form.primary_color}
              onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
            <input className="input-pg flex-1" value={form.primary_color}
              onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))} />
          </div>
        </Field>

        <button type="submit" disabled={saving} className="btn-primary w-fit disabled:opacity-50">
          {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar alterações'}
        </button>
      </form>

      {/* Trocar senha */}
      <form onSubmit={handleChangePassword} className="card-pg p-6 flex flex-col gap-4">
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Segurança</h2>
        <Field label="Nova senha">
          <input type="password" className="input-pg" placeholder="Mínimo 6 caracteres"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
        </Field>
        <button type="submit" disabled={pwSaving} className="btn-primary w-fit disabled:opacity-50">
          {pwSaving ? 'Salvando...' : pwSaved ? '✓ Senha alterada!' : 'Alterar senha'}
        </button>
      </form>
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
