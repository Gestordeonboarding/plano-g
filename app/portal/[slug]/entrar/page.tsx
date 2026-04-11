'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PinPad from '@/components/portal/PinPad'
import { ArrowLeft, ArrowRight, LogIn, UserPlus, User } from 'lucide-react'
import Link from 'next/link'

type Screen = 'intro' | 'pin' | 'cpf'

export default function EntrarPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [screen, setScreen] = useState<Screen | null>(null) // null = loading
  const [savedCpf, setSavedCpf] = useState<string | null>(null)
  const [savedName, setSavedName] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cpfInput, setCpfInput] = useState('')
  const [cpfLoading, setCpfLoading] = useState(false)
  const [cpfError, setCpfError] = useState<string | null>(null)

  useEffect(() => {
    const cpf = localStorage.getItem(`portal_cpf_${slug}`)
    const name = localStorage.getItem(`portal_name_${slug}`)
    if (cpf && name) {
      setSavedCpf(cpf)
      setSavedName(name)
      setScreen('pin')
    } else {
      setScreen('intro')
    }
  }, [slug])

  function formatCPF(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11)
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  async function handleCpfCheck(e: React.FormEvent) {
    e.preventDefault()
    setCpfLoading(true); setCpfError(null)
    const digits = cpfInput.replace(/\D/g, '')
    if (digits.length !== 11) { setCpfError('CPF inválido.'); setCpfLoading(false); return }

    const supabase = createClient()
    const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
    if (!tenant) { setCpfError('Escritório não encontrado.'); setCpfLoading(false); return }

    const { data: con } = await supabase
      .from('consorciados').select('full_name, user_id').eq('tenant_id', (tenant as {id:string}).id).eq('cpf', digits).single()

    if (!con) { setCpfError('CPF não encontrado. Fale com seu consultor.'); setCpfLoading(false); return }

    const c = con as { full_name: string; user_id: string | null }
    if (!c.user_id) {
      setCpfError('Você ainda não ativou sua conta. Use "Sou novo aqui".')
      setCpfLoading(false)
      return
    }

    const firstName = c.full_name.split(' ')[0]
    localStorage.setItem(`portal_cpf_${slug}`, digits)
    localStorage.setItem(`portal_name_${slug}`, firstName)
    setSavedCpf(digits)
    setSavedName(firstName)
    setScreen('pin')
    setCpfLoading(false)
  }

  async function handlePinConfirm() {
    if (!savedCpf || pin.length < 6) return
    setLoading(true); setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: `${savedCpf}@portal.local`,
      password: pin,
    })

    if (authError) {
      setError('PIN incorreto. Tente novamente.')
      setPin('')
      setLoading(false)
      return
    }
    router.push(`/portal/${slug}`)
  }

  function clearDevice() {
    localStorage.removeItem(`portal_cpf_${slug}`)
    localStorage.removeItem(`portal_name_${slug}`)
    setSavedCpf(null); setSavedName(null)
    setPin(''); setError(null)
    setScreen('intro')
  }

  // Loading state
  if (screen === null) return <div className="min-h-screen" />

  /* ── INTRO ─────────────────────────────────────────────────── */
  if (screen === 'intro') {
    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col">
        {/* Hero gradient */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-5"
          style={{ background: 'linear-gradient(160deg, var(--tenant-primary) 0%, color-mix(in srgb, var(--tenant-primary) 55%, #000) 100%)' }}>
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}>
            <span className="text-5xl">🏠</span>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white leading-tight">
              Seu consórcio na<br/>palma da mão
            </h1>
            <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed">
              Acompanhe sua cota, score de contemplação e próximas assembleias em tempo real.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 py-8 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <Link href={`/portal/${slug}/cadastrar`}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold shadow-lg transition-all active:scale-95"
            style={{ backgroundColor: 'var(--tenant-primary)', color: '#fff' }}>
            <UserPlus size={18} />
            Sou novo aqui
            <ArrowRight size={16} />
          </Link>

          <button onClick={() => setScreen('cpf')}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{ border: '1.5px solid var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'transparent' }}>
            <LogIn size={16} />
            Já tenho conta — Entrar
          </button>

          <p className="text-center text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            🔒 Seus dados são protegidos e criptografados
          </p>
        </div>
      </div>
    )
  }

  /* ── CPF FORM ─────────────────────────────────────────────── */
  if (screen === 'cpf') {
    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={() => setScreen('intro')}>
            <ArrowLeft size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Identificação</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <form onSubmit={handleCpfCheck} className="w-full max-w-sm flex flex-col gap-6">
            <div className="text-center flex flex-col gap-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'rgba(0,212,200,0.1)' }}>
                <User size={26} style={{ color: 'var(--tenant-primary)' }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Qual é o seu CPF?</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Para te identificar neste dispositivo
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <input
                className="input-pg text-center text-2xl tracking-widest font-mono py-4"
                placeholder="000.000.000-00"
                value={cpfInput}
                onChange={(e) => setCpfInput(formatCPF(e.target.value))}
                inputMode="numeric"
                maxLength={14}
                required
                autoFocus
              />
              {cpfError && (
                <p className="text-xs text-center px-3 py-2 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,92,92,0.08)', color: 'var(--danger)' }}>
                  {cpfError}
                </p>
              )}
            </div>

            <button type="submit" disabled={cpfLoading || cpfInput.replace(/\D/g, '').length !== 11}
              className="py-4 rounded-2xl text-base font-bold disabled:opacity-40 transition-all active:scale-95"
              style={{ backgroundColor: 'var(--tenant-primary)', color: '#fff' }}>
              {cpfLoading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  /* ── PIN PAD ─────────────────────────────────────────────── */
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <button onClick={clearDevice}>
          <ArrowLeft size={20} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Entrar</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 gap-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
            style={{ backgroundColor: 'var(--tenant-primary)', color: '#fff' }}>
            {savedName?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Bem-vindo de volta,</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{savedName}</p>
          </div>
        </div>

        <PinPad
          pin={pin}
          onChange={(p) => { setPin(p); if (error) setError(null) }}
          onConfirm={handlePinConfirm}
          label="Digite seu PIN de 6 dígitos"
          error={error}
          loading={loading}
        />

        <button onClick={clearDevice} className="text-xs py-1"
          style={{ color: 'var(--text-muted)' }}>
          Não é {savedName}? Trocar conta
        </button>
      </div>
    </div>
  )
}
