'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ValidatedRow {
  index: number
  data: Record<string, string | number | null>
  errors: string[]
  valid: boolean
}

interface Props {
  validRows: ValidatedRow[]
  allRows: ValidatedRow[]
  tenantId: string
  administradora: string
  fileName: string
  mapping: Record<string, string>
}

interface ImportResult {
  created: number
  updated: number
  errors: number
  importId: string | null
}

export default function Step4Import({ validRows, allRows, tenantId, administradora, fileName, mapping }: Props) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    runImport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runImport() {
    setStatus('running')
    try {
      const res = await fetch('/api/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          rows: validRows.map((r) => r.data),
          total_rows: allRows.length,
          error_rows: allRows.filter((r) => !r.valid).length,
          administradora,
          file_name: fileName,
          column_mapping: mapping,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na importação')
      setResult(data)
      setStatus('done')
    } catch (err) {
      setErrorMsg(String(err))
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {status === 'running' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            Importando {validRows.length} registros...
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Isso pode levar alguns segundos</p>
        </div>
      )}

      {status === 'done' && result && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <CheckCircle size={28} style={{ color: 'var(--accent)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Importação concluída!
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <ResultCard label="Criados" value={result.created} color="var(--accent)" />
            <ResultCard label="Atualizados" value={result.updated} color="#A78BFA" />
            <ResultCard label="Com erro" value={result.errors} color="var(--danger)" />
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/consorciados" className="btn-primary text-sm">
              Ver consorciados →
            </Link>
            <button onClick={() => window.location.reload()} className="btn-outline text-sm">
              Nova importação
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <XCircle size={28} style={{ color: 'var(--danger)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--danger)' }}>Erro na importação</h2>
          </div>
          <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,92,92,0.10)', color: 'var(--danger)' }}>
            {errorMsg}
          </p>
          <button onClick={() => window.location.reload()} className="btn-outline text-sm w-fit">
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}

function ResultCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card-pg p-4 text-center">
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}
