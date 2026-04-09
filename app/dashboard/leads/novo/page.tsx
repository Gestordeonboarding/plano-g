'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NovoLeadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', desired_credit: '',
    asset_type: '', monthly_income: '', source: 'manual', notes: '',
    has_existing_consortium: false,
  })

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    const u = userData as { tenant_id: string } | null
    if (!u) return

    let score = 0
    if (form.email) score += 20
    if (Number(form.desired_credit) > 50000) score += 30
    if (form.monthly_income) score += 20
    if (form.source === 'meta_ads' || form.source === 'google_ads') score += 15
    if (!form.has_existing_consortium) score += 15

    const { error: insertError } = await supabase.from('leads').insert({
      tenant_id: u.tenant_id,
      seller_id: user.id,
      full_name: form.full_name,
      phone: form.phone,
      email: form.email || null,
      desired_credit: form.desired_credit ? Number(form.desired_credit) : null,
      asset_type: form.asset_type || null,
      monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
      source: form.source,
      notes: form.notes || null,
      has_existing_consortium: form.has_existing_consortium,
      qualification_score: score,
      status: 'novo',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/leads')
  }

  return (
    <div className="max-w-xl">
      <Link href="/dashboard/leads" className="flex items-center gap-2 text-sm mb-6 hover:underline"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={14} /> Voltar para leads
      </Link>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Novo lead</h1>

      <form onSubmit={handleSubmit} className="card-pg p-6 flex flex-col gap-4">
        <Field label="Nome completo *">
          <input className="input-pg" value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)} required placeholder="João da Silva" />
        </Field>
        <Field label="Telefone *">
          <input className="input-pg" value={form.phone}
            onChange={(e) => set('phone', e.target.value)} required placeholder="(11) 99999-9999" />
        </Field>
        <Field label="Email">
          <input type="email" className="input-pg" value={form.email}
            onChange={(e) => set('email', e.target.value)} placeholder="joao@email.com" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo de bem">
            <select className="input-pg" value={form.asset_type} onChange={(e) => set('asset_type', e.target.value)}>
              <option value="">Selecione</option>
              <option value="imovel">Imóvel</option>
              <option value="auto">Auto</option>
              <option value="moto">Moto</option>
              <option value="servicos">Serviços</option>
              <option value="outros">Outros</option>
            </select>
          </Field>
          <Field label="Origem">
            <select className="input-pg" value={form.source} onChange={(e) => set('source', e.target.value)}>
              <option value="manual">Manual</option>
              <option value="meta_ads">Meta Ads</option>
              <option value="google_ads">Google Ads</option>
              <option value="indicacao">Indicação</option>
              <option value="organico">Orgânico</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Crédito desejado (R$)">
            <input type="number" className="input-pg" value={form.desired_credit}
              onChange={(e) => set('desired_credit', e.target.value)} placeholder="300000" />
          </Field>
          <Field label="Renda mensal (R$)">
            <input type="number" className="input-pg" value={form.monthly_income}
              onChange={(e) => set('monthly_income', e.target.value)} placeholder="5000" />
          </Field>
        </div>
        <Field label="Observações">
          <textarea className="input-pg resize-none" rows={3} value={form.notes}
            onChange={(e) => set('notes', e.target.value)} placeholder="Informações adicionais..." />
        </Field>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.has_existing_consortium}
            onChange={(e) => set('has_existing_consortium', e.target.checked)}
            className="w-4 h-4 accent-teal-400" />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Já possui consórcio ativo
          </span>
        </label>

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg"
            style={{ color: 'var(--danger)', backgroundColor: 'rgba(255,92,92,0.10)' }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Salvando...' : 'Criar lead'}
          </button>
          <Link href="/dashboard/leads" className="btn-outline text-sm flex items-center">Cancelar</Link>
        </div>
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
