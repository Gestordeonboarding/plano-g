'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export default function ActivatePortalButton({
  consorciado,
  hasUser,
}: {
  consorciado: Record<string, unknown>
  hasUser: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleActivate() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/portal/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consorciado_id: (consorciado as { id: string }).id }),
    })
    const result = await res.json()
    if (!res.ok) setError(result.error || 'Erro ao ativar portal.')
    else setDone(true)
    setLoading(false)
  }

  if (hasUser || done) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
        <ExternalLink size={12} /> Portal ativo
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={handleActivate} disabled={loading} className="btn-outline text-sm disabled:opacity-50">
        {loading ? 'Ativando...' : 'Ativar portal'}
      </button>
      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
}
