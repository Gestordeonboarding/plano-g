'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, UserPlus, LogIn } from 'lucide-react'

export default function PortalIntro({ slug }: { slug: string }) {
  const [savedName, setSavedName] = useState<string | null>(null)

  useEffect(() => {
    const name = localStorage.getItem(`portal_name_${slug}`)
    setSavedName(name)
  }, [slug])

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Hero */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-4"
        style={{
          background: 'linear-gradient(160deg, var(--tenant-primary) 0%, color-mix(in srgb, var(--tenant-primary) 60%, #000) 100%)',
        }}
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-2 shadow-2xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
        >
          <span className="text-4xl">🏠</span>
        </div>

        {savedName ? (
          <>
            <p className="text-white/70 text-sm font-medium">Bem-vindo de volta,</p>
            <h1 className="text-3xl font-bold text-white">{savedName}</h1>
          </>
        ) : (
          <>
            <p className="text-white/70 text-sm font-medium">Seu consórcio na palma da mão</p>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Acompanhe sua cota em tempo real
            </h1>
          </>
        )}

        <p className="text-white/60 text-sm max-w-xs leading-relaxed">
          {savedName
            ? 'Acesse sua cota, veja sua pontuação e fique por dentro das assembleias.'
            : 'Score de contemplação, próximas assembleias, simulador de lances e muito mais.'}
        </p>
      </div>

      {/* Buttons */}
      <div
        className="px-6 py-8 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}
      >
        {savedName ? (
          <>
            <Link
              href={`/portal/${slug}/entrar`}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: 'var(--tenant-primary)', color: '#fff' }}
            >
              <LogIn size={18} />
              Entrar
              <ArrowRight size={16} />
            </Link>
            <Link
              href={`/portal/${slug}/cadastrar`}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold"
              style={{ border: '1.5px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <UserPlus size={16} />
              Cadastrar com outro CPF
            </Link>
          </>
        ) : (
          <>
            <Link
              href={`/portal/${slug}/cadastrar`}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: 'var(--tenant-primary)', color: '#fff' }}
            >
              <UserPlus size={18} />
              Sou novo aqui
              <ArrowRight size={16} />
            </Link>
            <Link
              href={`/portal/${slug}/entrar`}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold"
              style={{ border: '1.5px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <LogIn size={16} />
              Já tenho conta — Entrar
            </Link>
          </>
        )}

        <p className="text-center text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Seus dados são protegidos e criptografados
        </p>
      </div>
    </div>
  )
}
