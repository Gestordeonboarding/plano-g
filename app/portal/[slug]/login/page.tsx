'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PortalLoginPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [isFirstAccess, setIsFirstAccess] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cpfChecked, setCpfChecked] = useState(false)

  function formatCPF(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  async function handleCheckCPF(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cpfDigits = cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setError('CPF inválido.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Buscar tenant pelo slug
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!tenant) {
      setError('Escritório não encontrado.')
      setLoading(false)
      return
    }

    // Verificar se existe consorciado com este CPF
    const { data: con } = await supabase
      .from('consorciados')
      .select('id, user_id, full_name')
      .eq('tenant_id', (tenant as { id: string }).id)
      .eq('cpf', cpfDigits)
      .single()

    if (!con) {
      setError('CPF não encontrado neste escritório.')
      setLoading(false)
      return
    }

    const c = con as { id: string; user_id: string | null; full_name: string }

    if (!c.user_id) {
      // Primeiro acesso — permite criar senha
      setIsFirstAccess(true)
    }

    setCpfChecked(true)
    setLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cpfDigits = cpf.replace(/\D/g, '')
    const supabase = createClient()

    if (isFirstAccess) {
      // Ativar portal e definir senha
      const res = await fetch('/api/portal/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfDigits, slug }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Erro ao ativar portal.')
        setLoading(false)
        return
      }

      // Fazer login com credenciais criadas
      const email = result.email
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: result.password,
      })
      if (authError) {
        setError('Erro ao fazer login automático. Tente novamente.')
        setLoading(false)
        return
      }

      // Atualizar senha se o usuário definiu uma nova
      if (newPassword) {
        await supabase.auth.updateUser({ password: newPassword })
      }
    } else {
      // Login normal — email = cpf@portal.local ou email real
      const email = `${cpfDigits}@portal.local`
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        // Tentar com email real se houver
        setError('CPF ou senha incorretos.')
        setLoading(false)
        return
      }
    }

    router.push(`/portal/${slug}`)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Acesso ao portal
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Digite seu CPF para entrar
          </p>
        </div>

        {!cpfChecked ? (
          <form onSubmit={handleCheckCPF} className="card-pg p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>CPF</label>
              <input
                className="input-pg text-center text-lg tracking-widest"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                inputMode="numeric"
                maxLength={14}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-center px-3 py-2 rounded-lg"
                style={{ color: 'var(--danger)', backgroundColor: 'rgba(255,92,92,0.10)' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50"
              style={{ backgroundColor: 'var(--tenant-primary)' }}>
              {loading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="card-pg p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
              <span>CPF: {cpf}</span>
              <button type="button" onClick={() => { setCpfChecked(false); setIsFirstAccess(false) }}
                className="underline text-xs" style={{ color: 'var(--tenant-primary)' }}>
                Alterar
              </button>
            </div>

            {isFirstAccess ? (
              <>
                <p className="text-sm p-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(0,212,200,0.10)', color: 'var(--accent)' }}>
                  Primeiro acesso! Crie sua senha para acessar o portal.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Criar senha
                  </label>
                  <input type="password" className="input-pg" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres" minLength={6} />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Senha</label>
                <input type="password" className="input-pg" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha" required />
              </div>
            )}

            {error && (
              <p className="text-sm text-center px-3 py-2 rounded-lg"
                style={{ color: 'var(--danger)', backgroundColor: 'rgba(255,92,92,0.10)' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50"
              style={{ backgroundColor: 'var(--tenant-primary)' }}>
              {loading ? 'Entrando...' : isFirstAccess ? 'Criar senha e entrar' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
