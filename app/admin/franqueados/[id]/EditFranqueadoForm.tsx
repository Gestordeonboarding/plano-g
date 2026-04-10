'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wifi, Plus, UserX, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface Tenant {
  id: string; name: string; slug: string; primary_color: string | null
  plan: string | null; is_active: boolean; zapi_instance_id: string | null
  zapi_token: string | null; whatsapp_phone: string | null
}

interface Seller {
  id: string; full_name: string | null; email: string | null
  role: string; is_active: boolean; created_at: string
}

export default function EditFranqueadoForm({
  tenant,
  sellers,
}: {
  tenant: Record<string, unknown>
  sellers: Record<string, unknown>[]
}) {
  const t = tenant as unknown as Tenant
  const sellerList = sellers as unknown as Seller[]
  const router = useRouter()

  const [form, setForm] = useState({
    name: t.name,
    primary_color: t.primary_color || '#00D4C8',
    plan: t.plan || 'profissional',
    is_active: t.is_active,
    zapi_instance_id: t.zapi_instance_id || '',
    zapi_token: t.zapi_token || '',
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Novo vendedor
  const [showNewSeller, setShowNewSeller] = useState(false)
  const [newSeller, setNewSeller] = useState({ name: '', email: '', password: '' })
  const [sellerLoading, setSellerLoading] = useState(false)
  const [sellerError, setSellerError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('tenants').update(form).eq('id', t.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDeactivate() {
    if (!confirm('Desativar este franqueado?')) return
    const supabase = createClient()
    await supabase.from('tenants').update({ is_active: false }).eq('id', t.id)
    router.push('/admin/franqueados')
  }

  async function handleCreateSeller(e: React.FormEvent) {
    e.preventDefault()
    setSellerLoading(true)
    setSellerError(null)
    const res = await fetch('/api/admin/create-seller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newSeller, tenant_id: t.id }),
    })
    const result = await res.json()
    if (!res.ok) {
      setSellerError(result.error || 'Erro ao criar vendedor.')
    } else {
      setShowNewSeller(false)
      setNewSeller({ name: '', email: '', password: '' })
      router.refresh()
    }
    setSellerLoading(false)
  }

  async function toggleSeller(sellerId: string, active: boolean) {
    const supabase = createClient()
    await supabase.from('users').update({ is_active: !active }).eq('id', sellerId)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Dados gerais */}
      <form onSubmit={handleSave} className="card-pg p-6 flex flex-col gap-5">
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Dados do escritório
        </h2>

        <Field label="Nome do escritório">
          <input
            className="input-pg"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </Field>

        <Field label="Slug (readonly)">
          <input
            className="input-pg opacity-50 cursor-not-allowed"
            value={t.slug}
            readOnly
          />
        </Field>

        <Field label="Cor principal">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
            />
            <input
              className="input-pg flex-1"
              value={form.primary_color}
              onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
            />
          </div>
        </Field>

        <Field label="Plano">
          <select
            className="input-pg"
            value={form.plan}
            onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
          >
            <option value="essencial">Essencial</option>
            <option value="profissional">Profissional</option>
            <option value="premium">Premium</option>
          </select>
        </Field>

        <Field label="Status">
          <select
            className="input-pg"
            value={form.is_active ? 'ativo' : 'inativo'}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'ativo' }))}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar alterações'}
          </button>
          {!form.is_active && (
            <button
              type="button"
              onClick={handleDeactivate}
              className="text-sm px-4 py-2 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              Desativar franqueado
            </button>
          )}
        </div>
      </form>

      {/* WhatsApp Z-API */}
      <div className="card-pg p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            WhatsApp — Z-API
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Configure a instância Z-API deste franqueado. O cliente vai escanear o QR Code nas Configurações do sistema.
          </p>
        </div>
        {t.whatsapp_phone && (
          <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(37,211,102,0.08)', color: '#25D366' }}>
            <Wifi size={14} />
            Conectado: +{t.whatsapp_phone}
          </div>
        )}
        <Field label="ID da Instância (Instance ID)">
          <input
            className="input-pg"
            placeholder="Ex: 3E12FA16850140EC05F02242E60F9610"
            value={form.zapi_instance_id}
            onChange={(e) => setForm((f) => ({ ...f, zapi_instance_id: e.target.value }))}
          />
        </Field>
        <Field label="Token da Instância">
          <input
            className="input-pg"
            placeholder="Ex: FECEDCB366352AD4D41382EC"
            value={form.zapi_token}
            onChange={(e) => setForm((f) => ({ ...f, zapi_token: e.target.value }))}
          />
        </Field>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Encontre essas informações em <strong>z-api.io → Instâncias Web → clique na instância → Credenciais</strong>
        </p>
        <button
          type="button"
          onClick={async () => {
            setSaving(true)
            const supabase = createClient()
            await supabase.from('tenants').update({
              zapi_instance_id: form.zapi_instance_id,
              zapi_token: form.zapi_token,
            }).eq('id', t.id)
            setSaving(false)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
          }}
          disabled={saving}
          className="btn-primary text-sm w-fit disabled:opacity-50"
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar credenciais Z-API'}
        </button>
      </div>

      {/* Vendedores */}
      <div className="card-pg p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Equipe ({sellerList.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowNewSeller(!showNewSeller)}
            className="btn-outline text-sm flex items-center gap-1"
          >
            <Plus size={14} /> Novo vendedor
          </button>
        </div>

        {showNewSeller && (
          <form
            onSubmit={handleCreateSeller}
            className="flex flex-col gap-3 p-4 rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Novo vendedor</p>
            <input className="input-pg" placeholder="Nome completo" value={newSeller.name}
              onChange={(e) => setNewSeller((s) => ({ ...s, name: e.target.value }))} required />
            <input type="email" className="input-pg" placeholder="Email" value={newSeller.email}
              onChange={(e) => setNewSeller((s) => ({ ...s, email: e.target.value }))} required />
            <input type="password" className="input-pg" placeholder="Senha" value={newSeller.password}
              onChange={(e) => setNewSeller((s) => ({ ...s, password: e.target.value }))} required minLength={6} />
            {sellerError && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>{sellerError}</p>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={sellerLoading} className="btn-primary text-sm disabled:opacity-50">
                {sellerLoading ? 'Criando...' : 'Criar vendedor'}
              </button>
              <button type="button" onClick={() => setShowNewSeller(false)} className="btn-outline text-sm">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {sellerList.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhum vendedor cadastrado neste escritório.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                {['Nome', 'Email', 'Cargo', 'Status', 'Ações'].map((h) => (
                  <th key={h} className="text-left pb-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sellerList.map((s) => (
                <SellerRow key={s.id} s={s} onToggle={toggleSeller} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function SellerRow({ s, onToggle }: { s: Seller; onToggle: (id: string, active: boolean) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [zapiId, setZapiId] = useState('')
  const [zapiToken, setZapiToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveZapi() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('users').update({ zapi_instance_id: zapiId, zapi_token: zapiToken }).eq('id', s.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <tr style={{ borderTop: '1px solid var(--border-color)' }}>
        <td className="py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
          {s.full_name || '—'}
        </td>
        <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
        <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
          {s.role === 'tenant_admin' ? 'Admin' : 'Vendedor'}
        </td>
        <td className="py-2.5">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={s.is_active
              ? { backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }
              : { backgroundColor: 'rgba(255,92,92,0.15)', color: 'var(--danger)' }}>
            {s.is_active ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td className="py-2.5 text-right">
          <div className="flex items-center gap-3 justify-end">
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>
              WhatsApp
            </button>
            <button onClick={() => onToggle(s.id, s.is_active)}
              className="text-xs hover:underline"
              style={{ color: s.is_active ? 'var(--danger)' : 'var(--accent)' }}>
              {s.is_active ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderTop: '1px solid var(--border-color)' }}>
          <td colSpan={5} className="py-3 px-2">
            <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Instância Z-API de {s.full_name || s.email}
              </p>
              <div className="flex gap-2">
                <input className="input-pg text-xs flex-1" placeholder="Instance ID"
                  value={zapiId} onChange={(e) => setZapiId(e.target.value)} />
                <input className="input-pg text-xs flex-1" placeholder="Token"
                  value={zapiToken} onChange={(e) => setZapiToken(e.target.value)} />
                <button onClick={saveZapi} disabled={saving}
                  className="btn-primary text-xs px-3 disabled:opacity-50 whitespace-nowrap">
                  {saving ? '...' : saved ? '✓' : 'Salvar'}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
