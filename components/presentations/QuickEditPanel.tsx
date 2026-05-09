'use client'

import { Slide, SlideElement, isTextElement } from '@/lib/presentations/types'

/**
 * Painel rápido: lista todos os campos editáveis do slide atual.
 * Cliente edita aqui sem precisar clicar no canvas.
 */

interface FieldDescriptor {
  elementId: string
  fieldKey: string
  fieldLabel: string
  type: 'text' | 'textarea'
  value: string
  placeholder?: string
}

function extractFields(slide: Slide): FieldDescriptor[] {
  const out: FieldDescriptor[] = []
  for (const el of slide.elements) {
    if (el.locked) continue

    if (isTextElement(el) && el.fieldKey && el.fieldLabel) {
      const isLong = el.h > 100 || (el.maxChars ?? 0) > 100
      out.push({
        elementId: el.id,
        fieldKey: el.fieldKey,
        fieldLabel: el.fieldLabel,
        type: isLong ? 'textarea' : 'text',
        value: el.content,
        placeholder: el.placeholder,
      })
    }
    // stat-card
    if (el.type === 'stat-card' && el.fieldKeyValue && el.fieldLabel) {
      out.push({
        elementId: el.id,
        fieldKey: el.fieldKeyValue,
        fieldLabel: el.fieldLabel,
        type: 'text',
        value: el.value,
      })
    }
    // list-item
    if (el.type === 'list-item' && el.fieldKey && el.fieldLabel) {
      out.push({
        elementId: el.id,
        fieldKey: el.fieldKey,
        fieldLabel: el.fieldLabel,
        type: 'text',
        value: el.text,
      })
    }
    // badge — sem fieldKey por padrão, mas se tiver
    // comparison
    if (el.type === 'comparison' && el.fieldKeyValue && el.fieldLabel) {
      out.push({
        elementId: el.id,
        fieldKey: el.fieldKeyValue,
        fieldLabel: `${el.fieldLabel} — Valor`,
        type: 'text',
        value: el.value,
      })
      if (el.fieldKeyDesc) {
        out.push({
          elementId: el.id,
          fieldKey: el.fieldKeyDesc,
          fieldLabel: `${el.fieldLabel} — Descrição`,
          type: 'textarea',
          value: el.description ?? '',
        })
      }
    }
    // timeline-step
    if (el.type === 'timeline-step' && el.fieldKeyTitle && el.fieldLabel) {
      out.push({
        elementId: el.id,
        fieldKey: el.fieldKeyTitle,
        fieldLabel: `${el.fieldLabel} — Título`,
        type: 'text',
        value: el.title,
      })
      if (el.fieldKeyDesc) {
        out.push({
          elementId: el.id,
          fieldKey: el.fieldKeyDesc,
          fieldLabel: `${el.fieldLabel} — Descrição`,
          type: 'textarea',
          value: el.description ?? '',
        })
      }
    }
  }
  return out
}

interface Props {
  slide: Slide
  onElementUpdate: (elementId: string, fieldKey: string, value: string) => void
}

export default function QuickEditPanel({ slide, onElementUpdate }: Props) {
  const fields = extractFields(slide)

  if (fields.length === 0) {
    return (
      <div className="flex flex-col gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <p>Nenhum campo editável neste slide.</p>
        <p>Clique nos elementos do canvas para editar.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)', letterSpacing: 2 }}>
        Edição rápida
      </p>
      {fields.map((f) => (
        <div key={`${f.elementId}-${f.fieldKey}`} className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {f.fieldLabel}
          </label>
          {f.type === 'textarea' ? (
            <textarea
              className="input-pg text-xs resize-none"
              rows={3}
              value={f.value}
              placeholder={f.placeholder}
              onChange={(e) => onElementUpdate(f.elementId, f.fieldKey, e.target.value)}
            />
          ) : (
            <input
              className="input-pg text-xs"
              value={f.value}
              placeholder={f.placeholder}
              onChange={(e) => onElementUpdate(f.elementId, f.fieldKey, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
