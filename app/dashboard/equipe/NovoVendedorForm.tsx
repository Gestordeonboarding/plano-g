'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

export default function NovoVendedorForm({ tenantId }: { tenantId: string }) {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/create-seller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tenant_id: tenantId }),
    })
    const result = await res.json()
    if (!res.ok) {
      setError(result.error || 'Erro ao criar vendedor.')
    } else {
      setShow(false)
      setForm({ name: '', email: '', password: '' })
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="card-pg p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Adicionar vendedor</p>
        <button onClick={() => setShow(!show)} className="btn-outline text-sm flex items-center gap-1">
          <Plus size={14} /> {show ? 'Cancelar' : 'Novo vendedor'}
        </button>
      </div>

      {show && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input className="input-pg" placeholder="Nome completo" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <input type="email" className="input-pg" placeholder="Email" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <input type="password" className="input-pg" placeholder="Senha (mín. 6 caracteres)" value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={6} />
          {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary text-sm w-fit disabled:opacity-50">
            {loading ? 'Criando...' : 'Criar vendedor'}
          </button>
        </form>
      )}
    </div>
  )
}
