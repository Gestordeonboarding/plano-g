'use client'

import { Delete } from 'lucide-react'
import { useEffect } from 'react'

interface PinPadProps {
  pin: string
  onChange: (pin: string) => void
  onConfirm: () => void
  length?: number
  loading?: boolean
  label?: string
  error?: string | null
}

export default function PinPad({
  pin,
  onChange,
  onConfirm,
  length = 6,
  loading = false,
  label = 'Digite seu PIN',
  error,
}: PinPadProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (loading) return
      if (e.key >= '0' && e.key <= '9') press(e.key)
      if (e.key === 'Backspace') del()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  function press(digit: string) {
    if (pin.length < length) {
      const next = pin + digit
      onChange(next)
      if (next.length === length) setTimeout(() => onConfirm(), 120)
    }
  }

  function del() {
    onChange(pin.slice(0, -1))
  }

  const buttons = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Label */}
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {error && (
          <p className="text-xs mt-1 px-4 py-1.5 rounded-full inline-block mt-2"
            style={{ backgroundColor: 'rgba(255,92,92,0.12)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}
      </div>

      {/* Dots */}
      <div className="flex items-center gap-4">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-150"
            style={{
              width: 16,
              height: 16,
              backgroundColor: i < pin.length
                ? 'var(--tenant-primary)'
                : 'var(--bg-tertiary)',
              transform: i === pin.length - 1 && pin.length > 0 ? 'scale(1.25)' : 'scale(1)',
              border: '2px solid',
              borderColor: i < pin.length ? 'var(--tenant-primary)' : 'var(--border-color)',
            }}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--tenant-primary)', borderTopColor: 'transparent' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Verificando...</span>
        </div>
      )}

      {/* Keypad */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {buttons.map((btn, i) => {
            if (btn === '') return <div key={i} />
            if (btn === '⌫') return (
              <button
                key={i}
                onClick={del}
                className="flex items-center justify-center rounded-2xl transition-all active:scale-90"
                style={{
                  height: 68,
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Delete size={20} />
              </button>
            )
            return (
              <button
                key={i}
                onClick={() => press(btn)}
                className="flex items-center justify-center rounded-2xl text-2xl font-semibold transition-all active:scale-90"
                style={{
                  height: 68,
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }}
              >
                {btn}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
