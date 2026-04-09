'use client'

import { useState } from 'react'
import { ColumnMapping, SYSTEM_FIELDS, EMPTY_MAPPING } from './types'

interface Props {
  headers: string[]
  administradora: string
  savedMapping: Record<string, string> | null
  onComplete: (mapping: ColumnMapping) => void
  onSaveMapping: (administradora: string, mapping: ColumnMapping) => void
  onBack: () => void
}

export default function Step2Mapping({ headers, administradora, savedMapping, onComplete, onSaveMapping, onBack }: Props) {
  const initial = savedMapping
    ? { ...EMPTY_MAPPING, ...savedMapping } as ColumnMapping
    : EMPTY_MAPPING

  const [mapping, setMapping] = useState<ColumnMapping>(initial)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    onSaveMapping(administradora, mapping)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleContinue() {
    const missing = SYSTEM_FIELDS.filter((f) => f.required && !mapping[f.key])
    if (missing.length > 0) {
      alert(`Campos obrigatórios não mapeados: ${missing.map((m) => m.label).join(', ')}`)
      return
    }
    onComplete(mapping)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Mapeie as colunas da planilha para os campos do sistema
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Administradora: <strong>{administradora}</strong> · {headers.length} colunas detectadas
          </p>
        </div>
        <button onClick={handleSave} className="btn-outline text-sm">
          {saved ? '✓ Salvo!' : `Salvar mapeamento para ${administradora}`}
        </button>
      </div>

      <div className="card-pg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              {['Campo do sistema', 'Coluna na planilha', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SYSTEM_FIELDS.map((field) => (
              <tr key={field.key} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {field.label}
                  {field.required && <span style={{ color: 'var(--danger)' }}> *</span>}
                </td>
                <td className="px-4 py-3">
                  <select
                    className="input-pg"
                    value={mapping[field.key]}
                    onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value }))}
                  >
                    <option value="">— não mapear —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {mapping[field.key] ? (
                    <span style={{ color: 'var(--accent)' }} className="text-xs">✓ mapeado</span>
                  ) : field.required ? (
                    <span style={{ color: 'var(--danger)' }} className="text-xs">obrigatório</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-outline text-sm">← Voltar</button>
        <button onClick={handleContinue} className="btn-primary">Validar dados →</button>
      </div>
    </div>
  )
}
