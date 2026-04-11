'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PinPad from '@/components/portal/PinPad'
import { ArrowLeft, CheckCircle, User, KeyRound } from 'lucide-react'
import Link from 'next/link'

type Step = 'cpf' | 'confirmar' | 'pin' | 'confirmar_pin' | 'sucesso'

export default function CadastrarPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [step, setStep] = useState<Step>('cpf')
  const [cpf, setCpf] = useState('')
  const [foundName, setFoundName] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function formatCPF(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11)
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  async function handleCheckCPF(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11) { setError('CPF inválido.'); setLoading(false); return }

    const supabase = createClient()
    const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', slug).single()
    if (!tenant) { setError('Escritório não encontrado.'); setLoading(false); return }

    const { data: con } = await supabase
      .from('consorciados').select('id, full_name, user_id').eq('tenant_id', (tenant as {id:string}).id).eq('cpf', digits).single()

    if (!con) { setError('CPF não encontrado. Fale com seu consultor.'); setLoading(false); return }

    const c = con as { id: string; full_name: string; user_id: string | null }
    if (c.user_id) { setError('Este CPF já possui cadastro. Use o botão "Entrar".'); setLoading(false); return }

    setFoundName(c.full_name)
    setStep('confirmar')
    setLoading(false)
  }

  async function handleCreateAccount() {
    if (pin.length < 6) return
    setLoading(true)
    setError(null)

    // 1. Activate (create Supabase auth user with temp credentials)
    const res = await fetch('/api/portal/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: cpf.replace(/\D/g, ''), slug }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao criar conta.'); setLoading(false); return }

    // 2. Sign in with temp credentials
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (signInError) { setError('Erro ao ativar conta. Tente novamente.'); setLoading(false); return }

    // 3. Update password to user's chosen PIN
    const { error: updateError } = await supabase.auth.updateUser({ password: pin })
    if (updateError) { setError('Erro ao definir PIN.'); setLoading(false); return }

    // 4. Save to localStorage for quick return
    const firstName = foundName.split(' ')[0]
    localStorage.setItem(`portal_cpf_${slug}`, cpf.replace(/\D/g, ''))
    localStorage.setItem(`portal_name_${slug}`, firstName)

    setStep('sucesso')
    setLoading(false)
  }

  function handlePinComplete(newPin: string) {
    setPin(newPin)
    if (newPin.length === 6) {
      setTimeout(() => { setPin(''); setStep('confirmar_pin') }, 150)
    }
  }

  function handleConfirmPinComplete(confirmPin: string) {
    setPinConfirm(confirmPin)
    if (confirmPin.length === 6) {
      if (confirmPin !== pin && pin) {
        // mismatch - but pin was cleared, need to use pinConfirm as the actual
      }
      // we set pin in handlePinComplete but then cleared it, so use confirmPin directly
      // Actually let's keep track differently
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        {step !== 'sucesso' && (
          <button onClick={() => {
            if (step === 'cpf') router.push(`/portal/${slug}`)
            else if (step === 'confirmar') setStep('cpf')
            else if (step === 'pin') setStep('confirmar')
            else if (step === 'confirmar_pin') { setStep('pin'); setPin(''); setPinConfirm('') }
          }}>
            <ArrowLeft size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        )}
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {step === 'cpf' ? 'Criar conta' : step === 'confirmar' ? 'Confirmar identidade' : step === 'sucesso' ? '' : 'Criar PIN'}
        </p>
        {/* Progress dots */}
        {step !== 'sucesso' && (
          <div className="ml-auto flex items-center gap-1.5">
            {(['cpf', 'confirmar', 'pin'] as const).map((s) => (
              <div key={s} className="w-2 h-2 rounded-full transition-all"
                style={{ backgroundColor: s === step || (step === 'confirmar_pin' && s === 'pin') ? 'var(--tenant-primary)' : 'var(--bg-tertiary)' }} />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">

        {/* STEP: CPF */}
        {step === 'cpf' && (
          <form onSubmit={handleCheckCPF} className="w-full max-w-sm flex flex-col gap-6">
            <div className="text-center flex flex-col gap-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'rgba(0,212,200,0.1)' }}>
                <User size={26} style={{ color: 'var(--tenant-primary)' }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Qual é o seu CPF?</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Seu consultor já cadastrou seu CPF no sistema
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <input
                className="input-pg text-center text-2xl tracking-widest font-mono py-4"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                inputMode="numeric"
                maxLength={14}
                required
              />
              {error && (
                <p className="text-xs text-center px-3 py-2 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,92,92,0.08)', color: 'var(--danger)' }}>{error}</p>
              )}
            </div>

            <button type="submit" disabled={loading || cpf.replace(/\D/g, '').length !== 11}
              className="py-4 rounded-2xl text-base font-bold disabled:opacity-40 transition-all active:scale-95"
              style={{ backgroundColor: 'var(--tenant-primary)', color: '#fff' }}>
              {loading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        )}

        {/* STEP: Confirmar identidade */}
        {step === 'confirmar' && (
          <div className="w-full max-w-sm flex flex-col gap-6 text-center">
            <div className="flex flex-col gap-3 items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: 'var(--tenant-primary)', color: '#fff' }}>
                {foundName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Encontramos seu cadastro</p>
                <h2 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  Olá, {foundName.split(' ')[0]}!
                </h2>
              </div>
            </div>

            <div className="px-5 py-4 rounded-2xl text-sm"
              style={{ backgroundColor: 'rgba(0,212,200,0.08)', border: '1px solid rgba(0,212,200,0.2)', color: 'var(--text-secondary)' }}>
              Agora você vai criar um <strong>PIN de 6 dígitos</strong> para acessar o sistema rapidamente. Escolha algo fácil de lembrar.
            </div>

            <button onClick={() => { setStep('pin'); setPin(''); setPinConfirm('') }}
              className="py-4 rounded-2xl text-base font-bold transition-all active:scale-95"
              style={{ backgroundColor: 'var(--tenant-primary)', color: '#fff' }}>
              Criar meu PIN
            </button>
          </div>
        )}

        {/* STEP: Criar PIN */}
        {step === 'pin' && (
          <div className="w-full flex flex-col items-center gap-8">
            <div className="text-center">
              <KeyRound size={28} style={{ color: 'var(--tenant-primary)', margin: '0 auto 8px' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Crie seu PIN</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>6 dígitos — use algo fácil de lembrar</p>
            </div>
            <PinPad
              pin={pin}
              onChange={setPin}
              onConfirm={() => {
                if (pin.length === 6) {
                  const savedPin = pin
                  setTimeout(() => {
                    setPin(savedPin)
                    setPinConfirm('')
                    setStep('confirmar_pin')
                  }, 100)
                }
              }}
              label="Digite 6 dígitos"
              error={error}
            />
          </div>
        )}

        {/* STEP: Confirmar PIN */}
        {step === 'confirmar_pin' && (
          <div className="w-full flex flex-col items-center gap-8">
            <div className="text-center">
              <KeyRound size={28} style={{ color: 'var(--tenant-primary)', margin: '0 auto 8px' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Confirme seu PIN</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Digite os mesmos 6 dígitos novamente</p>
            </div>
            <PinPad
              pin={pinConfirm}
              onChange={setPinConfirm}
              onConfirm={async () => {
                if (pinConfirm.length === 6) {
                  if (pinConfirm !== pin) {
                    setError('PINs não conferem. Tente novamente.')
                    setPinConfirm('')
                    setTimeout(() => setError(null), 2000)
                    return
                  }
                  await handleCreateAccount()
                }
              }}
              label="Repita o PIN"
              error={error}
              loading={loading}
            />
          </div>
        )}

        {/* STEP: Sucesso */}
        {step === 'sucesso' && (
          <div className="flex flex-col items-center gap-6 text-center px-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(37,211,102,0.12)' }}>
              <CheckCircle size={40} color="#25D366" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Pronto, {foundName.split(' ')[0]}!
              </h2>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                Sua conta está ativa. Na próxima vez, é só informar seu PIN.
              </p>
            </div>
            <button onClick={() => router.push(`/portal/${slug}`)}
              className="py-4 px-8 rounded-2xl text-base font-bold transition-all active:scale-95 w-full"
              style={{ backgroundColor: 'var(--tenant-primary)', color: '#fff' }}>
              Ver minha cota agora →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
