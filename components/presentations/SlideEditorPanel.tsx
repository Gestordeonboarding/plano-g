'use client'

import { Slide } from '@/lib/presentations/types'

interface Props {
  slide: Slide
  onFieldChange: (key: string, value: string) => void
}

export default function SlideEditorPanel({ slide, onFieldChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {slide.title}
      </p>
      {slide.editable_fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {field.label}
            {field.required && <span style={{ color: 'var(--danger)' }}> *</span>}
          </label>

          {field.type === 'textarea' ? (
            <textarea
              className="input-pg text-xs resize-none"
              rows={3}
              value={field.value}
              onChange={(e) => onFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.max_chars}
            />
          ) : field.type === 'currency' ? (
            <input
              type="number"
              className="input-pg text-xs"
              value={field.value}
              onChange={(e) => onFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              step="0.01"
            />
          ) : field.type === 'select' && field.options ? (
            <select className="input-pg text-xs" value={field.value}
              onChange={(e) => onFieldChange(field.key, e.target.value)}>
              <option value="">Selecione...</option>
              {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              className="input-pg text-xs"
              value={field.value}
              onChange={(e) => onFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.max_chars}
            />
          )}
        </div>
      ))}
    </div>
  )
}
