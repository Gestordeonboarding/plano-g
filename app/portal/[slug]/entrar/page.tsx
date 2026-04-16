'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PinPad from '@/components/portal/PinPad'
import { ArrowLeft, LogIn, UserPlus, User, TrendingUp, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

type Screen = 'intro' | 'pin' | 'cpf'

/* ─── Canvas: particle network ──────────────────────────── */
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let raf: number

    // Read tenant color from CSS
    const primary = getComputedStyle(document.documentElement)
      .getPropertyValue('--tenant-primary').trim() || '#00D4C8'

    function resize() {
      if (!c) return
      c.width = c.offsetWidth * window.devicePixelRatio
      c.height = c.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    interface Particle {
      x: number; y: number; vx: number; vy: number
      r: number; opacity: number; color: string
    }

    const W = () => c.offsetWidth
    const H = () => c.offsetHeight

    const pts: Particle[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      r: Math.random() * 1.8 + 0.6,
      opacity: Math.random() * 0.5 + 0.15,
      color: Math.random() > 0.5 ? primary : '#818cf8',
    }))

    // Animated chart path
    const chartPoints = [0.05, 0.35, 0.22, 0.55, 0.38, 0.70, 0.52, 0.85, 0.65, 0.62, 0.80, 0.45, 0.92, 0.30]
    let chartProgress = 0

    function draw() {
      const w = W(), h = H()
      ctx.clearRect(0, 0, w, h)

      // Connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 110) {
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(0,212,200,${0.1 * (1 - d / 110)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Particles
      pts.forEach(p => {
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
        grd.addColorStop(0, p.color + 'cc')
        grd.addColorStop(1, p.color + '00')
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
      })

      // Animated chart line (draws in from left over time)
      if (chartProgress < 1) chartProgress += 0.004
      const lineY = h * 0.55
      const lineH = h * 0.18
      ctx.beginPath()
      ctx.moveTo(0, lineY)
      const totalPts = chartPoints.length
      for (let i = 0; i < totalPts - 1; i++) {
        const progress = (i + 1) / (totalPts - 1)
        if (progress > chartProgress) break
        const x = (chartPoints[i] * w)
        const y = lineY - chartPoints[i + 1] * lineH
        ctx.lineTo(x, y)
      }
      ctx.strokeStyle = `rgba(0,212,200,0.18)`
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Glow under chart
      const grad = ctx.createLinearGradient(0, lineY - lineH, 0, lineY + 20)
      grad.addColorStop(0, 'rgba(0,212,200,0.06)')
      grad.addColorStop(1, 'rgba(0,212,200,0)')
      ctx.lineTo(chartPoints[totalPts - 2] * w, lineY + 20)
      ctx.lineTo(0, lineY + 20)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.9 }}
    />
  )
}

/* ─── Main component ─────────────────────────────────────── */
export default function EntrarPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [screen, setScreen] = useState<Screen | null>(null)
  const [savedCpf, setSavedCpf] = useState<string | null>(null)
  const [savedName, setSavedName] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const pinRef = useRef('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cpfInput, setCpfInput] = useState('')
  const [cpfLoading, setCpfLoading] = useState(false)
  const [cpfError, setCpfError] = useState<string | null>(null)

  useEffect(() => {
    const cpf = localStorage.getItem(`portal_cpf_${slug}`)
    const name = localStorage.getItem(`portal_name_${slug}`)
    if (cpf && name) {
      setSavedCpf(cpf); setSavedName(name); setScreen('pin')
    } else {
      setScreen('intro')
    }
  }, [slug])

  function formatCPF(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11)
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  async function handleCpfCheck(e: React.FormEvent) {
    e.preventDefault()
    setCpfLoading(true); setCpfError(null)
    const digits = cpfInput.replace(/\D/g, '')
    if (digits.length !== 11) { setCpfError('CPF inválido.'); setCpfLoading(false); return }

    const res = await fetch('/api/portal/check-cpf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: digits, slug }),
    })
    const data = await res.json()
    if (!res.ok) { setCpfError(data.error || 'Erro ao verificar CPF.'); setCpfLoading(false); return }

    const firstName = data.name as string
    localStorage.setItem(`portal_cpf_${slug}`, digits)
    localStorage.setItem(`portal_name_${slug}`, firstName)
    setSavedCpf(digits); setSavedName(firstName); setScreen('pin')
    setCpfLoading(false)
  }

  async function handlePinConfirm() {
    const currentPin = pinRef.current
    if (!savedCpf || currentPin.length < 6) return
    setLoading(true); setError(null)
    const supabase = createClient()
    const derivedPassword = currentPin + savedCpf.slice(0, 4)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: `${savedCpf}@portal.local`, password: derivedPassword,
    })
    if (authError) { setError('PIN incorreto. Tente novamente.'); setPin(''); pinRef.current = ''; setLoading(false); return }
    window.location.href = `/portal/${slug}`
  }

  function clearDevice() {
    localStorage.removeItem(`portal_cpf_${slug}`)
    localStorage.removeItem(`portal_name_${slug}`)
    setSavedCpf(null); setSavedName(null); setPin(''); setError(null); setScreen('intro')
  }

  if (screen === null) {
    return <div style={{ minHeight: 'calc(100vh - 56px)', background: '#050810' }} />
  }

  /* ══════════════════════════════════════════════
     INTRO — TELA LUXUOSA ANIMADA
  ══════════════════════════════════════════════ */
  if (screen === 'intro') {
    return (
      <>
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes shimmer {
            0%   { background-position: -300% center; }
            100% { background-position: 300% center; }
          }
          @keyframes pulseRing {
            0%, 100% { transform: scale(0.9);  opacity: 0.5; }
            50%       { transform: scale(1.12); opacity: 0.12; }
          }
          @keyframes pulseRing2 {
            0%, 100% { transform: scale(0.85); opacity: 0.3; }
            50%       { transform: scale(1.2);  opacity: 0.08; }
          }
          @keyframes glowPulse {
            0%, 100% { opacity: 0.5; }
            50%       { opacity: 1; }
          }
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          .shimmer-text {
            background: linear-gradient(90deg,
              rgba(255,255,255,0.9) 0%,
              rgba(255,255,255,0.9) 25%,
              var(--tenant-primary) 50%,
              rgba(255,255,255,0.9) 75%,
              rgba(255,255,255,0.9) 100%
            );
            background-size: 300% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 4s linear infinite;
          }
          .fu1 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.05s both; }
          .fu2 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.2s  both; }
          .fu3 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.35s both; }
          .fu4 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.5s  both; }
          .fu5 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.65s both; }
          .ring1 {
            position: absolute; border-radius: 50%;
            border: 1px solid rgba(0,212,200,0.3);
            animation: pulseRing 3s ease-in-out infinite;
          }
          .ring2 {
            position: absolute; border-radius: 50%;
            border: 1px solid rgba(0,212,200,0.15);
            animation: pulseRing2 3s ease-in-out 1.5s infinite;
          }
          .glow-orb {
            animation: glowPulse 4s ease-in-out infinite;
          }
          .spin-ring {
            position: absolute; inset: -6px; border-radius: 50%;
            border: 1.5px solid transparent;
            border-top-color: rgba(0,212,200,0.6);
            border-right-color: rgba(124,58,237,0.4);
            animation: rotate 6s linear infinite;
          }
          .btn-glow {
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .btn-glow:active {
            transform: scale(0.97) !important;
          }
          .stat-card {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 14px 10px;
            display: flex; flex-direction: column;
            align-items: center; gap: 6px;
            flex: 1;
            transition: border-color 0.3s ease;
          }
        `}</style>

        {/* Escape layout padding with negative margin */}
        <div style={{
          position: 'relative',
          margin: '-20px -16px',
          minHeight: 'calc(100vh - 56px)',
          background: 'linear-gradient(160deg, #05060f 0%, #08091a 45%, #060e10 100%)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Animated particle canvas */}
          <ParticleCanvas />

          {/* Deep glow orbs */}
          <div className="glow-orb" style={{
            position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)',
            width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,212,200,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '20%', right: '-80px',
            width: 240, height: 240, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '35%', left: '-60px',
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,212,200,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Content area */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '40px 24px 16px',
            position: 'relative', zIndex: 1,
            gap: 32,
          }}>

            {/* Icon with animated rings */}
            <div className="fu1" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="ring1" style={{ inset: -28 }} />
              <div className="ring2" style={{ inset: -52 }} />
              <div style={{ position: 'relative' }}>
                <div className="spin-ring" />
                <div style={{
                  width: 96, height: 96, borderRadius: 30,
                  background: 'linear-gradient(135deg, var(--tenant-primary) 0%, #7c3aed 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 1px rgba(0,212,200,0.3), 0 16px 48px rgba(0,212,200,0.35), 0 4px 16px rgba(0,0,0,0.6)',
                  position: 'relative', zIndex: 1,
                }}>
                  <TrendingUp size={46} color="#fff" strokeWidth={1.8} />
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="fu2" style={{ textAlign: 'center' }}>
              <p style={{
                color: 'rgba(255,255,255,0.35)', fontSize: 11,
                fontWeight: 700, letterSpacing: '0.22em',
                textTransform: 'uppercase', marginBottom: 14,
              }}>
                Portal do Consorciado
              </p>
              <h1 className="shimmer-text" style={{
                fontSize: 33, fontWeight: 900,
                lineHeight: 1.1, letterSpacing: '-0.025em',
                margin: '0 0 16px',
              }}>
                Seu patrimônio<br />na palma da mão
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.38)', fontSize: 14,
                lineHeight: 1.7, maxWidth: 280, margin: '0 auto',
              }}>
                Acompanhe sua cota, score de contemplação e próximas assembleias em tempo real.
              </p>
            </div>

            {/* Stats strip */}
            <div className="fu3" style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
              {[
                { icon: <Shield size={18} />, label: 'Criptografado' },
                { icon: <Zap size={18} />,    label: 'Tempo real' },
                { icon: <TrendingUp size={18} />, label: 'Score ao vivo' },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <span style={{ color: 'var(--tenant-primary)' }}>{s.icon}</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 600, textAlign: 'center' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom action area */}
          <div style={{ padding: '0 24px 44px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>

            {/* Primary CTA */}
            <div className="fu4">
              <Link
                href={`/portal/${slug}/cadastrar`}
                className="btn-glow"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '19px 24px', borderRadius: 22,
                  background: 'linear-gradient(135deg, var(--tenant-primary) 0%, #7c3aed 100%)',
                  color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none',
                  boxShadow: '0 0 0 1px rgba(0,212,200,0.3), 0 8px 32px rgba(0,212,200,0.4), 0 2px 8px rgba(0,0,0,0.5)',
                  letterSpacing: '-0.01em',
                }}
              >
                <UserPlus size={19} strokeWidth={2.2} />
                Sou novo aqui
              </Link>
            </div>

            {/* Secondary */}
            <div className="fu5">
              <button
                onClick={() => setScreen('cpf')}
                className="btn-glow"
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '18px 24px', borderRadius: 22,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: 15,
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <LogIn size={17} />
                Já tenho conta — Entrar
              </button>
            </div>

            <p style={{
              textAlign: 'center', color: 'rgba(255,255,255,0.18)',
              fontSize: 11, marginTop: 4, letterSpacing: '0.02em',
            }}>
              🔒 Segurança nível bancário · Dados criptografados
            </p>
          </div>
        </div>
      </>
    )
  }

  /* ══════════════════════════════════════════════
     TELA: IDENTIFICAÇÃO POR CPF (novo dispositivo)
  ══════════════════════════════════════════════ */
  if (screen === 'cpf') {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={() => setScreen('intro')}>
            <ArrowLeft size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Identificação</p>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <form onSubmit={handleCpfCheck} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: 'rgba(0,212,200,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
              }}>
                <User size={26} style={{ color: 'var(--tenant-primary)' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Qual é o seu CPF?</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Para te identificar neste dispositivo</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                className="input-pg"
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: '0.12em', fontFamily: 'monospace', padding: '16px' }}
                placeholder="000.000.000-00"
                value={cpfInput}
                onChange={(e) => setCpfInput(formatCPF(e.target.value))}
                inputMode="numeric"
                maxLength={14}
                required
                autoFocus
              />
              {cpfError && (
                <p style={{
                  fontSize: 12, textAlign: 'center', padding: '10px 16px', borderRadius: 12,
                  background: 'rgba(255,92,92,0.08)', color: 'var(--danger)',
                }}>{cpfError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={cpfLoading || cpfInput.replace(/\D/g, '').length !== 11}
              style={{
                padding: '16px', borderRadius: 18, fontSize: 15, fontWeight: 700,
                background: 'var(--tenant-primary)', color: '#fff',
                opacity: (cpfLoading || cpfInput.replace(/\D/g, '').length !== 11) ? 0.4 : 1,
                transition: 'opacity 0.2s',
                cursor: 'pointer',
              }}
            >
              {cpfLoading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════
     TELA: PIN PAD (usuário recorrente)
  ══════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @keyframes fadeUp2 { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .pf1 { animation: fadeUp2 0.5s ease 0s    both; }
        .pf2 { animation: fadeUp2 0.5s ease 0.1s  both; }
        .pf3 { animation: fadeUp2 0.5s ease 0.2s  both; }
      `}</style>

      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={clearDevice}>
            <ArrowLeft size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Entrar</p>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: 32 }}>
          <div className="pf1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 76, height: 76, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--tenant-primary), #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontWeight: 800, color: '#fff',
              boxShadow: '0 8px 28px color-mix(in srgb, var(--tenant-primary) 40%, transparent)',
            }}>
              {savedName?.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bem-vindo de volta,</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{savedName}</p>
            </div>
          </div>

          <div className="pf2" style={{ width: '100%' }}>
            <PinPad
              pin={pin}
              onChange={(p) => { setPin(p); pinRef.current = p; if (error) setError(null) }}
              onConfirm={handlePinConfirm}
              label="Digite seu PIN de 6 dígitos"
              error={error}
              loading={loading}
            />
          </div>

          <button
            onClick={clearDevice}
            className="pf3"
            style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 8px', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            Não é {savedName}? Trocar conta
          </button>
        </div>
      </div>
    </>
  )
}
