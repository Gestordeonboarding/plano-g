'use client'

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Upload } from 'lucide-react'
import { ADMINISTRADORAS } from './types'

interface Props {
  onComplete: (data: {
    rows: Record<string, string>[]
    headers: string[]
    administradora: string
    fileName: string
  }) => void
  savedMappings: Record<string, Record<string, string>>
}

export default function Step1Upload({ onComplete, savedMappings }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [administradora, setAdministradora] = useState('Embracon')
  const [preview, setPreview] = useState<{ rows: Record<string, string>[]; headers: string[] } | null>(null)
  const [fileName, setFileName] = useState('')
  const [dragOver, setDragOver] = useState(false)

  function processFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const wb = XLSX.read(data, { type: 'binary', cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

      const rows = json.map((r) =>
        Object.fromEntries(Object.entries(r).map(([k, v]) => [String(k), String(v)]))
      )
      const headers = rows.length > 0 ? Object.keys(rows[0]) : []
      setPreview({ rows, headers })
    }
    reader.readAsBinaryString(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const hasSavedMapping = !!savedMappings[administradora]

  return (
    <div className="flex flex-col gap-5">
      {/* Administradora */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Qual administradora é esta planilha?
        </label>
        <select
          className="input-pg max-w-xs"
          value={administradora}
          onChange={(e) => setAdministradora(e.target.value)}
        >
          {ADMINISTRADORAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        {hasSavedMapping && (
          <p className="text-xs" style={{ color: 'var(--accent)' }}>
            ✓ Mapeamento salvo encontrado para {administradora}
          </p>
        )}
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors py-12"
        style={{
          borderColor: dragOver ? 'var(--accent)' : 'var(--border-color)',
          backgroundColor: dragOver ? 'rgba(0,212,200,0.05)' : 'var(--bg-tertiary)',
        }}
      >
        <Upload size={32} style={{ color: dragOver ? 'var(--accent)' : 'var(--text-muted)' }} />
        <div className="text-center">
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {fileName || 'Arraste ou clique para enviar'}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Formatos suportados: .xlsx, .csv
          </p>
        </div>
        <input ref={inputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileInput} />
      </div>

      {/* Preview das primeiras 5 linhas */}
      {preview && preview.rows.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Prévia — {preview.rows.length} linhas detectadas
          </p>
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-color)' }}>
            <table className="text-xs w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {preview.headers.slice(0, 8).map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap"
                      style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                  {preview.headers.length > 8 && (
                    <th className="px-3 py-2 text-left" style={{ color: 'var(--text-muted)' }}>
                      +{preview.headers.length - 8} colunas
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 5).map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                    {preview.headers.slice(0, 8).map((h) => (
                      <td key={h} className="px-3 py-2 whitespace-nowrap max-w-[140px] truncate"
                        style={{ color: 'var(--text-primary)' }}>{row[h]}</td>
                    ))}
                    {preview.headers.length > 8 && <td />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="btn-primary w-fit"
            onClick={() => onComplete({ rows: preview.rows, headers: preview.headers, administradora, fileName })}
          >
            Continuar para mapeamento →
          </button>
        </div>
      )}
    </div>
  )
}
