'use client'

import { useState, useEffect, useCallback } from 'react'
import { Smartphone, CheckCircle, RefreshCw, XCircle, Wifi } from 'lucide-react'

type Status = 'idle' | 'loading' | 'qr' | 'connected' | 'error'

export default function WhatsAppConnect({ initialPhone }: { initialPhone: string | null }) {
  const [status, setStatus] = useState<Status>(initialPhone ? 'connected' : 'idle')
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(initialPhone)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)

  const checkStatus = useCallback(async () => {
    const res = await fetch('/api/whatsapp/status')
    const data = await res.json() as { status: string; phone: string | null }
    if (data.status === 'connected') {
      setStatus('connected')
      setPhone(data.phone)
      setQrcode(null)
    }
    return data.status
  }, [])

  useEffect(() => {
    if (status !== 'qr') return
    const interval = setInterval(async () => {
      const s = await checkStatus()
      if (s === 'connected') clearInterval(interval)
    }, 3000)
    return () => clearInterval(interval)
  }, [status, checkStatus])

  useEffect(() => {
    if (status !== 'qr') return
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); setStatus('idle'); setQrcode(null); return 60 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [status])

  async function handleConnect() {
    setStatus('loading')
    setError(null)
    const res = await fetch('/api/whatsapp/qr')
    const data = await res.json() as { qrcode?: string; error?: string }
    if (!res.ok || !data.qrcode) {
      setStatus('error')
      setError(data.error || 'Falha ao gerar QR Code')
      return
    }
    setQrcode(data.qrcode)
    setStatus('qr')
  }

  return (
    <div className="card-pg p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(37,211,102,0.12)', color: '#25D366' }}>
          <Smartphone size={18} />
        </div>
        <div>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            WhatsApp do Escritório
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Conecte e receba contatos automaticamente como leads
          </p>
        </div>
      </div>

      {/* Conectado */}
      {status === 'connected' && (
        <div className="rounded-xl p-4 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.3)' }}>
          <div className="flex items-center gap-3">
            <CheckCircle size={22} color="#25D366" />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Conectado</p>
              {phone && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  +{phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi size={12} color="#25D366" />
            <span className="text-xs font-medium" style={{ color: '#25D366' }}>Online</span>
          </div>
        </div>
      )}

      {/* Botão conectar */}
      {status === 'idle' && (
        <div className="flex flex-col gap-3">
          <div className="text-sm rounded-xl p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Como funciona:</p>
            <ol className="flex flex-col gap-1" style={{ color: 'var(--text-secondary)' }}>
              <li>1. Clique em "Conectar WhatsApp"</li>
              <li>2. Abra o WhatsApp no seu celular</li>
              <li>3. Vá em <strong>Dispositivos conectados → Conectar dispositivo</strong></li>
              <li>4. Aponte a câmera para o QR Code</li>
              <li>5. Pronto! Novos contatos viram leads automaticamente</li>
            </ol>
          </div>
          <button onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: '#25D366', color: '#fff' }}>
            <Smartphone size={16} />
            Conectar WhatsApp
          </button>
        </div>
      )}

      {/* Carregando */}
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <RefreshCw size={24} className="animate-spin" style={{ color: '#25D366' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gerando QR Code...</p>
        </div>
      )}

      {/* QR Code */}
      {status === 'qr' && qrcode && (
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 rounded-2xl bg-white shadow-md">
            {qrcode.startsWith('data:image') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrcode} alt="QR Code WhatsApp" width={220} height={220} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`data:image/png;base64,${qrcode}`} alt="QR Code WhatsApp" width={220} height={220} />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Aponte a câmera do WhatsApp para este código
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Expira em <strong style={{ color: countdown <= 15 ? 'var(--danger)' : 'var(--text-primary)' }}>
                {countdown}s
              </strong> · Aguardando conexão...
            </p>
          </div>
          <button onClick={handleConnect}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            <RefreshCw size={11} /> Gerar novo QR Code
          </button>
        </div>
      )}

      {/* Erro */}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <XCircle size={28} style={{ color: 'var(--danger)' }} />
          <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={handleConnect}
            className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
