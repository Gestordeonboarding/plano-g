'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'

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
      style={{
        minHeight: '100vh',
        background: 'var(--g-bg-root)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--g-bg-surface)',
          border: '1px solid var(--g-border)',
          borderRadius: 'var(--g-radius-xl)',
          padding: '36px 32px',
        }}
      >
        {/* ── Logo central — sem texto "Plano G" ─────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 32,
            gap: 14,
          }}
        >
          <Logo size={52} />
          <p style={{ fontSize: 12, color: 'var(--g-text-ghost)', margin: 0 }}>
            Acesse sua conta
          </p>
        </div>

        {/* ── Formulário ─────────────────────────────────────────────── */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label
              htmlFor="email"
              style={{
                fontSize: 11,
                color: 'var(--g-text-muted)',
                display: 'block',
                marginBottom: 5,
              }}
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                fontSize: 11,
                color: 'var(--g-text-muted)',
                display: 'block',
                marginBottom: 5,
              }}
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              style={{
                fontSize: 12,
                color: 'var(--g-danger-text)',
                background: 'var(--g-danger-bg)',
                border: '1px solid var(--g-danger-border)',
                borderRadius: 'var(--g-radius-md)',
                padding: '8px 12px',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              width: '100%',
              background: 'var(--g-accent)',
              color: 'var(--g-bg-root)',
              border: 'none',
              borderRadius: 'var(--g-radius-md)',
              padding: 10,
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      {/* Aviso fora do card, bem discreto */}
      <p
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--g-text-ghost)',
          margin: 0,
        }}
      >
        Acesso restrito — Solicite credenciais ao administrador
      </p>
    </div>
  )
}
