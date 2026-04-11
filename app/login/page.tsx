'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData.user) {
      setError('Email ou senha inválidos.')
      setLoading(false)
      return
    }

    // Redireciona conforme o papel do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    const role = (userData as { role: string } | null)?.role
    window.location.replace(role === 'agency_admin' ? '/admin' : '/dashboard')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
            Plano G
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Sistema de Consórcios
          </p>
        </div>

        <div className="rounded-xl p-8" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            Entrar na plataforma
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-pg" placeholder="seu@email.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Senha
              </label>
              <input
                id="password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-pg" placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm rounded-lg px-3 py-2"
                style={{ color: 'var(--danger)', backgroundColor: 'rgba(255,92,92,0.10)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ width: '100%' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Acesso restrito. Solicite credenciais ao administrador.
        </p>
      </div>
    </div>
  )
}
