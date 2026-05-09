'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2, Image as ImageIcon, X } from 'lucide-react'

interface Props {
  value: string | null
  onChange: (url: string | null) => void
  /** logo da empresa ou foto do vendedor */
  kind: 'logo' | 'photo'
  label: string
  hint?: string
  /** Forma do preview */
  shape?: 'circle' | 'square' | 'rect'
  size?: number
}

export default function ImageUpload({
  value, onChange, kind, label, hint, shape = 'square', size = 80,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande (máx 10MB)')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('kind', kind)
      const res = await fetch('/api/presentations/upload', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error || 'Falha no upload')
      onChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

  const previewWidth = shape === 'rect' ? size * 2 : size
  const radius = shape === 'circle' ? '50%' : shape === 'rect' ? 12 : 10

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>

      <div className="flex items-center gap-3">
        {/* Preview clicável */}
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          className="relative overflow-hidden flex items-center justify-center transition-all hover:opacity-90 disabled:cursor-not-allowed"
          style={{
            width: previewWidth,
            height: size,
            borderRadius: radius,
            backgroundColor: value ? 'transparent' : 'var(--bg-tertiary)',
            border: value ? '1px solid var(--border-color)' : '2px dashed var(--border-color)',
          }}
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={label}
              style={{
                width: '100%',
                height: '100%',
                objectFit: shape === 'rect' ? 'contain' : 'cover',
                background: shape === 'rect' ? 'rgba(255,255,255,0.05)' : undefined,
              }}
            />
          ) : (
            <ImageIcon size={20} style={{ color: 'var(--text-muted)' }} />
          )}
        </button>

        {/* Botões */}
        <div className="flex flex-col gap-1.5">
          {value ? (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="text-xs px-2.5 py-1 rounded-md font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-xs hover:underline self-start flex items-center gap-1"
                style={{ color: 'var(--danger)' }}
              >
                <X size={11} /> Remover
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              <Upload size={11} />
              {uploading ? 'Enviando...' : 'Enviar imagem'}
            </button>
          )}
          {hint && (
            <p className="text-[10px] max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
              {hint}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
