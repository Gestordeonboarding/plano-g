'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'

export default function NovoFranqueadoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    email: '',
    password: '',
    primary_color: '#00D4C8',
    plan: 'profissional',
  })

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugify(name) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin
      ? // admin só disponível no service role — usar API route
        { data: null, error: new Error('use_api') }
      : { data: null, error: new Error('use_api') }

    if (authError?.message === 'use_api') {
      // Chamar API route para criar usuário com service role
      const res = await fetch('/api/admin/create-franqueado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Erro ao criar franqueado.')
        setLoading(false)
        return
      }

      router.push('/admin/franqueados')
      return
    }

    setLoading(false)
  }

  return (
    <div className="max-w-xl">
      <Link
        href="/admin/franqueados"
        className="flex items-center gap-2 text-sm mb-6 hover:underline"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={14} /> Voltar para franqueados
      </Link>

      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        Novo franqueado
      </h1>

      <form onSubmit={handleSubmit} className="card-pg p-6 flex flex-col gap-5">
        <Field label="Nome do escritório *">
          <input
            className="input-pg"
            placeholder="Ex: Imóveis Premium SP"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
        </Field>

        <Field label="Slug (URL do portal)" hint={`/portal/${form.slug || 'meu-escritorio'}`}>
          <input
            className="input-pg"
            placeholder="imoveis-premium-sp"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
          />
        </Field>

        <Field label="Email do responsável *">
          <input
            type="email"
            className="input-pg"
            placeholder="responsavel@escritorio.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </Field>

        <Field label="Senha provisória *">
          <input
            type="password"
            className="input-pg"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={6}
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
              placeholder="#00D4C8"
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

        {error && (
          <p
            className="text-sm px-3 py-2 rounded-lg"
            style={{ color: 'var(--danger)', backgroundColor: 'rgba(255,92,92,0.10)' }}
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Criando...' : 'Criar franqueado'}
          </button>
          <Link href="/admin/franqueados" className="btn-outline text-sm flex items-center">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}
