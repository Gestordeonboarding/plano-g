'use client'

import { useState, useEffect, useCallback } from 'react'
import { Smartphone, CheckCircle, RefreshCw, XCircle, Wifi, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Step = 'name' | 'loading' | 'qr' | 'connected' | 'error'

export default function ConectarWhatsApp({
  initialPhone,
  initialName,
  tenantId,
}: {
  initialPhone: string | null
  initialName: string | null
  tenantId: string
}) {
  const [step, setStep] = useState<Step>(initialPhone ? 'connected' : 'name')
  const [name, setName] = useState(initialName || '')
  const [editingName, setEditingName] = useState(false)
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(initialPhone)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)

  const checkStatus = useCallback(async () => {
    const res = await fetch('/api/whatsapp/status')
    const data = await res.json() as { status: string; phone: string | null }
    if (data.status === 'connected') {
      setStep('connected')
      setPhone(data.phone)
      setQrcode(null)
    }
    return data.status
  }, [])

  useEffect(() => {
    if (step !== 'qr') return
    const interval = setInterval(async () => {
      const s = await checkStatus()
      if (s === 'connected') clearInterval(interval)
    }, 3000)
    return () => clearInterval(interval)
  }, [step, checkStatus])

  useEffect(() => {
    if (step !== 'qr') return
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); setStep('name'); setQrcode(null); return 60 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  async function saveName() {
    if (!name.trim()) return
    const supabase = createClient()
    await supabase.from('tenants').update({ whatsapp_name: name.trim() }).eq('id', tenantId)
    setEditingName(false)
  }

  async function handleConnect() {
    if (!name.trim()) {
      setError('Dê um nome para esta conexão antes de continuar.')
      return
    }
    setError(null)
    // Save name first
    const supabase = createClient()
    await supabase.from('tenants').update({ whatsapp_name: name.trim() }).eq('id', tenantId)

    setStep('loading')
    const res = await fetch('/api/whatsapp/qr')
    const data = await res.json() as { qrcode?: string; error?: string }
    if (!res.ok || !data.qrcode) {
      setStep('error')
      setError(data.error || 'Falha ao gerar QR Code. Tente novamente.')
      return
    }
    setQrcode(data.qrcode)
    setStep('qr')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Card de status da conexão */}
      {step === 'connected' && (
        <div className="card-pg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(37,211,102,0.15)' }}>
                <Smartphone size={18} color="#25D366" />
              </div>
              <div>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="input-pg text-sm py-1 px-2 h-auto"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveName()}
                      autoFocus
                    />
                    <button onClick={saveName} className="text-xs font-medium px-2 py-1 rounded"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}>
                      OK
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {name || 'WhatsApp Conectado'}
                    </p>
                    <button onClick={() => setEditingName(true)}>
                      <Edit2 size={12} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </div>
                )}
                {phone && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>+{phone}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(37,211,102,0.1)' }}>
              <Wifi size={11} color="#25D366" />
              <span className="text-xs font-semibold" style={{ color: '#25D366' }}>Conectado</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs p-3 rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            <CheckCircle size={13} style={{ color: 'var(--accent)' }} />
            Todas as mensagens recebidas neste número aparecem automaticamente em <strong style={{ color: 'var(--text-secondary)' }}>Conversas</strong>
          </div>
        </div>
      )}

      {/* Etapa: nomear e conectar */}
      {step === 'name' && (
        <div className="card-pg p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(37,211,102,0.12)', color: '#25D366' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Conectar WhatsApp
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Seu número receberá leads e mensagens automaticamente
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Nome desta conexão
            </label>
            <input
              className="input-pg"
              placeholder="Ex: WhatsApp do Escritório, WhatsApp Vendas..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Este nome aparece para identificar o número conectado
            </p>
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
          )}

          <button
            onClick={handleConnect}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity"
            style={{ backgroundColor: '#25D366', color: '#fff' }}
          >
            <Smartphone size={16} />
            Conectar WhatsApp
          </button>
        </div>
      )}

      {/* Carregando QR */}
      {step === 'loading' && (
        <div className="card-pg p-10 flex flex-col items-center gap-4">
          <RefreshCw size={28} className="animate-spin" style={{ color: '#25D366' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gerando QR Code...</p>
        </div>
      )}

      {/* QR Code */}
      {step === 'qr' && qrcode && (
        <div className="card-pg p-6 flex flex-col items-center gap-5">
          <div>
            <p className="text-center font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Escaneie o código com seu celular
            </p>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white shadow-lg">
            {qrcode.startsWith('data:image') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrcode} alt="QR Code WhatsApp" width={230} height={230} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`data:image/png;base64,${qrcode}`} alt="QR Code WhatsApp" width={230} height={230} />
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Expira em{' '}
            <strong style={{ color: countdown <= 15 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {countdown}s
            </strong>{' '}
            · Aguardando leitura...
          </p>
          <button
            onClick={handleConnect}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={11} /> Gerar novo código
          </button>
        </div>
      )}

      {/* Erro */}
      {step === 'error' && (
        <div className="card-pg p-8 flex flex-col items-center gap-3">
          <XCircle size={30} style={{ color: 'var(--danger)' }} />
          <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button
            onClick={() => { setStep('name'); setError(null) }}
            className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
