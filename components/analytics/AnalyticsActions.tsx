'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, UserPlus, TrendingUp, Users, Plus, CheckCircle, ChevronDown, Loader2 } from 'lucide-react'

type ModalType = 'seller' | 'lead' | 'consorciado' | null

interface Seller { id: string; name: string }

interface Props {
  tenantId: string
  sellers: Seller[]
}

/* ─── Modal overlay ─────────────────────────────────────── */
function Modal({ title, subtitle, icon: Icon, color, onClose, children }: {
  title: string
  subtitle: string
  icon: React.ElementType
  color: string
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div ref={ref} className="w-full max-w-md rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between"
          style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}18` }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5">
            <X size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}

function Success({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(37,211,102,0.15)' }}>
        <CheckCircle size={28} color="#25D366" />
      </div>
      <div>
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{message}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Dados atualizados!</p>
      </div>
    </div>
  )
}

/* ─── Seller Modal ─────────────────────────────────────── */
function SellerModal({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch('/api/admin/create-seller', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tenant_id: tenantId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Erro ao criar vendedor.'); return }
    setSuccess(true)
    router.refresh()
  }

  return (
    <Modal title="Novo Vendedor" subtitle="Adicionar ao ranking de performance" icon={UserPlus} color="#00D4C8" onClose={onClose}>
      {success ? <Success message="Vendedor criado com sucesso!" onClose={onClose} /> : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Nome completo">
            <input className="input-pg" placeholder="João Silva" value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
          </Field>
          <Field label="Email de acesso">
            <input type="email" className="input-pg" placeholder="joao@email.com" value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
          </Field>
          <Field label="Senha inicial">
            <input type="password" className="input-pg" placeholder="Mínimo 6 caracteres" value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
          </Field>
          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,92,92,0.1)', color: 'var(--danger)' }}>{error}</p>
          )}
          <button type="submit" disabled={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 mt-1"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Criando...</> : <><UserPlus size={15} /> Criar Vendedor</>}
          </button>
        </form>
      )}
    </Modal>
  )
}

/* ─── Lead Modal ─────────────────────────────────────── */
function LeadModal({ tenantId, sellers, onClose }: { tenantId: string; sellers: Seller[]; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', asset_type: '', source: 'manual', seller_id: '', desired_credit: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch('/api/leads/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tenant_id: tenantId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Erro ao criar lead.'); return }
    setSuccess(true)
    router.refresh()
  }

  const assetOptions = [
    { value: 'imovel', label: '🏠 Imóvel' },
    { value: 'auto', label: '🚗 Automóvel' },
    { value: 'moto', label: '🏍️ Moto' },
    { value: 'servicos', label: '⚙️ Serviços' },
    { value: 'outros', label: '📦 Outros' },
  ]

  const sourceOptions = [
    { value: 'manual', label: 'Manual / Interno' },
    { value: 'indicacao', label: 'Indicação' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'site', label: 'Site' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'outros', label: 'Outros' },
  ]

  return (
    <Modal title="Novo Lead" subtitle="Adicionar ao funil e mix de produtos" icon={TrendingUp} color="#A78BFA" onClose={onClose}>
      {success ? <Success message="Lead adicionado ao funil!" onClose={onClose} /> : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Nome do lead">
            <input className="input-pg" placeholder="Maria Santos" value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
          </Field>
          <Field label="Telefone">
            <input className="input-pg" placeholder="(11) 99999-9999" value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo de bem">
              <div className="relative">
                <select className="input-pg appearance-none pr-8 w-full" value={form.asset_type}
                  onChange={(e) => setForm(f => ({ ...f, asset_type: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {assetOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              </div>
            </Field>
            <Field label="Origem">
              <div className="relative">
                <select className="input-pg appearance-none pr-8 w-full" value={form.source}
                  onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))}>
                  {sourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Responsável">
              <div className="relative">
                <select className="input-pg appearance-none pr-8 w-full" value={form.seller_id}
                  onChange={(e) => setForm(f => ({ ...f, seller_id: e.target.value }))}>
                  <option value="">Sem responsável</option>
                  {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              </div>
            </Field>
            <Field label="Crédito desejado (R$)">
              <input type="number" className="input-pg" placeholder="ex: 80000" value={form.desired_credit}
                onChange={(e) => setForm(f => ({ ...f, desired_credit: e.target.value }))} />
            </Field>
          </div>
          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,92,92,0.1)', color: 'var(--danger)' }}>{error}</p>
          )}
          <button type="submit" disabled={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 mt-1"
            style={{ backgroundColor: '#A78BFA', color: '#fff' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : <><TrendingUp size={15} /> Adicionar Lead</>}
          </button>
        </form>
      )}
    </Modal>
  )
}

/* ─── Consorciado Modal ─────────────────────────────────────── */
function ConsorciadoModal({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', credit_value: '', administrator: '', asset_type: '', status: 'ativo', installments_paid: '', total_installments: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch('/api/consorciados/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tenant_id: tenantId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Erro ao cadastrar.'); return }
    setSuccess(true)
    router.refresh()
  }

  const statusOptions = [
    { value: 'ativo', label: '✅ Ativo', color: 'var(--accent)' },
    { value: 'contemplado', label: '🏆 Contemplado', color: '#A78BFA' },
    { value: 'inadimplente', label: '⚠️ Inadimplente', color: '#FFB547' },
    { value: 'cancelado', label: '❌ Cancelado', color: '#FF5C5C' },
  ]

  const assetOptions = [
    { value: 'imovel', label: '🏠 Imóvel' },
    { value: 'auto', label: '🚗 Automóvel' },
    { value: 'moto', label: '🏍️ Moto' },
    { value: 'servicos', label: '⚙️ Serviços' },
    { value: 'outros', label: '📦 Outros' },
  ]

  return (
    <Modal title="Novo Consorciado" subtitle="Registrar cota na carteira" icon={Users} color="#25D366" onClose={onClose}>
      {success ? <Success message="Consorciado cadastrado!" onClose={onClose} /> : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Nome do cliente">
            <input className="input-pg" placeholder="Carlos Oliveira" value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor da cota (R$)">
              <input type="number" className="input-pg" placeholder="ex: 120000" value={form.credit_value}
                onChange={(e) => setForm(f => ({ ...f, credit_value: e.target.value }))} />
            </Field>
            <Field label="Administradora">
              <input className="input-pg" placeholder="ex: Porto Seguro" value={form.administrator}
                onChange={(e) => setForm(f => ({ ...f, administrator: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo de bem">
              <div className="relative">
                <select className="input-pg appearance-none pr-8 w-full" value={form.asset_type}
                  onChange={(e) => setForm(f => ({ ...f, asset_type: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {assetOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              </div>
            </Field>
            <Field label="Status">
              <div className="relative">
                <select className="input-pg appearance-none pr-8 w-full" value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                  {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Parcelas pagas">
              <input type="number" className="input-pg" placeholder="ex: 12" value={form.installments_paid}
                onChange={(e) => setForm(f => ({ ...f, installments_paid: e.target.value }))} />
            </Field>
            <Field label="Total de parcelas">
              <input type="number" className="input-pg" placeholder="ex: 60" value={form.total_installments}
                onChange={(e) => setForm(f => ({ ...f, total_installments: e.target.value }))} />
            </Field>
          </div>
          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,92,92,0.1)', color: 'var(--danger)' }}>{error}</p>
          )}
          <button type="submit" disabled={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 mt-1"
            style={{ backgroundColor: '#25D366', color: '#fff' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : <><Users size={15} /> Cadastrar Consorciado</>}
          </button>
        </form>
      )}
    </Modal>
  )
}

/* ─── Main export: FAB + trigger buttons ─────────────────────────────────────── */
export function AddSellerButton({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
        style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)', border: '1px solid rgba(0,212,200,0.2)' }}>
        <Plus size={12} /> Novo Vendedor
      </button>
      {open && <SellerModal tenantId={tenantId} onClose={() => setOpen(false)} />}
    </>
  )
}

export function AddLeadButton({ tenantId, sellers, label = 'Novo Lead', color = '#A78BFA' }: { tenantId: string; sellers: Seller[]; label?: string; color?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
        style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}30` }}>
        <Plus size={12} /> {label}
      </button>
      {open && <LeadModal tenantId={tenantId} sellers={sellers} onClose={() => setOpen(false)} />}
    </>
  )
}

export function AddConsorciadoButton({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
        style={{ backgroundColor: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)' }}>
        <Plus size={12} /> Novo Consorciado
      </button>
      {open && <ConsorciadoModal tenantId={tenantId} onClose={() => setOpen(false)} />}
    </>
  )
}
