'use client'

/**
 * Editor de apresentação — modelo v3 tipado.
 *
 * Lê uma presentation já criada (com field_values preenchidos do briefing)
 * e mostra:
 *  - Lista de slides (sidebar esquerda) — clica pra navegar
 *  - Preview central com SlideStage + SlideRenderer
 *  - Painel de edição dos field_values (sidebar direita)
 *  - Botões: salvar, apresentar (fullscreen), compartilhar
 *
 * Tudo dinâmico — alterar um field_value e o preview atualiza instantaneamente.
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Play, Share2, Save, Eye, EyeOff,
  ChevronLeft, ChevronRight, Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  PresentationTemplate, Presentation, Slide,
  FieldDef, FieldValues, PresentationTheme,
} from '@/lib/presentations/types'
import { processFieldValues, formatCurrencyBR } from '@/lib/presentations/interpolate'
import { SlideStage } from './SlideStage'
import SlideRenderer from './SlideRenderer'

interface Props {
  template: PresentationTemplate | null
  tenantId: string
  sellerId: string
  presentationId: string
  initialPresentation: Presentation & { customization: { field_values?: FieldValues; theme?: PresentationTheme } }
}

export default function PresentationEditor({
  template,
  presentationId,
  initialPresentation,
}: Props) {
  const router = useRouter()
  const fields = useMemo<FieldDef[]>(() => template?.fields ?? [], [template])

  const [slides, setSlides] = useState<Slide[]>(initialPresentation.slides ?? [])
  const [values, setValues] = useState<FieldValues>(() => {
    const stored = initialPresentation.customization?.field_values ?? {}
    return { ...stored }
  })
  const [currentIdx, setCurrentIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedJustNow, setSavedJustNow] = useState(false)

  const theme = useMemo<PresentationTheme>(
    () =>
      initialPresentation.customization?.theme ??
      template?.theme ?? {
        primary: '#00c4b4',
        background: '#0a1512',
        font: 'Inter',
        style: 'minimal',
      },
    [initialPresentation, template],
  )

  // Processa values pra interpolação (formata moeda, telefone, etc)
  const processedValues = useMemo(
    () => processFieldValues(values, fields),
    [values, fields],
  )

  const currentSlide = slides[currentIdx]

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function toggleSlideVisible(idx: number) {
    setSlides((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, visible: s.visible === false ? true : false } : s)),
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('presentations')
        .update({
          slides,
          customization: {
            ...initialPresentation.customization,
            field_values: values,
            theme,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', presentationId)
      if (error) throw error
      setSavedJustNow(true)
      setTimeout(() => setSavedJustNow(false), 2000)
    } catch (err) {
      console.error('[PresentationEditor] save error:', err)
      alert('Erro ao salvar: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleShare() {
    await handleSave()
    router.push(`/dashboard/apresentacoes/${presentationId}/apresentar`)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--g-bg-root)' }}>
      {/* Topbar */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--g-border)',
          background: 'var(--g-bg-surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <Link
          href="/dashboard/apresentacoes"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--g-text-muted)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--g-text-primary)' }}>
          {initialPresentation.title}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: '1px solid var(--g-border)',
            color: savedJustNow ? 'var(--g-accent)' : 'var(--g-text-secondary)',
            borderRadius: 8,
            padding: '7px 12px',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
        >
          {savedJustNow ? <Check size={12} /> : <Save size={12} />}
          {saving ? 'Salvando...' : savedJustNow ? 'Salvo' : 'Salvar'}
        </button>

        <Link
          href={`/dashboard/apresentacoes/${presentationId}/apresentar`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--g-accent)',
            color: 'var(--g-bg-root)',
            border: 'none',
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
          onClick={handleShare}
        >
          <Play size={12} />
          Apresentar
        </Link>
      </div>

      {/* Main 3 colunas */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Sidebar slides */}
        <div
          style={{
            width: 200,
            borderRight: '1px solid var(--g-border)',
            background: 'var(--g-bg-surface)',
            overflowY: 'auto',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--g-text-ghost)',
              padding: '0 4px 4px',
            }}
          >
            {slides.length} slides
          </div>
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentIdx(i)}
              style={{
                position: 'relative',
                width: '100%',
                background: i === currentIdx ? 'var(--g-accent-dim)' : 'transparent',
                border: `1px solid ${i === currentIdx ? 'var(--g-accent-border)' : 'var(--g-border-soft)'}`,
                borderRadius: 8,
                padding: 6,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                opacity: s.visible === false ? 0.4 : 1,
              }}
            >
              <SlideStage mode="thumbnail">
                <SlideRenderer slide={s} theme={theme} values={processedValues} />
              </SlideStage>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                <span style={{ fontSize: 10, color: 'var(--g-text-muted)' }}>
                  {i + 1}. {s.type}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSlideVisible(i)
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--g-text-ghost)',
                    cursor: 'pointer',
                    padding: 2,
                  }}
                  title={s.visible === false ? 'Mostrar slide' : 'Ocultar slide'}
                >
                  {s.visible === false ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
              </div>
            </button>
          ))}
        </div>

        {/* Preview central */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--g-bg-depth)',
            padding: 24,
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }}>
            {currentSlide && (
              <SlideStage mode="preview">
                <SlideRenderer slide={currentSlide} theme={theme} values={processedValues} />
              </SlideStage>
            )}
          </div>

          {/* Navegação */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginTop: 12,
            }}
          >
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              style={navBtnStyle(currentIdx === 0)}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 12, color: 'var(--g-text-muted)' }}>
              {currentIdx + 1} / {slides.length}
            </span>
            <button
              onClick={() => setCurrentIdx((i) => Math.min(slides.length - 1, i + 1))}
              disabled={currentIdx === slides.length - 1}
              style={navBtnStyle(currentIdx === slides.length - 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Painel direito — edição dos field_values */}
        <div
          style={{
            width: 320,
            borderLeft: '1px solid var(--g-border)',
            background: 'var(--g-bg-surface)',
            overflowY: 'auto',
            padding: 18,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--g-accent)',
              marginBottom: 16,
            }}
          >
            Dados da apresentação
          </div>

          {fields.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--g-text-muted)' }}>
              Esse template não tem campos editáveis. Clique em Salvar e depois Apresentar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {fields.map((f) => (
                <InlineField
                  key={f.key}
                  field={f}
                  value={values[f.key] ?? ''}
                  onChange={(v) => setValue(f.key, v)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
//  Componente: campo editável inline
// ============================================================================

function InlineField({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label
        style={{
          fontSize: 10,
          color: 'var(--g-text-muted)',
          display: 'block',
          marginBottom: 4,
          fontWeight: 500,
          letterSpacing: '0.05em',
        }}
      >
        {field.label}
        {field.required && <span style={{ color: 'var(--g-accent)', marginLeft: 3 }}>*</span>}
      </label>

      {field.type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Selecione...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === 'currency' ? (
        <input
          type="text"
          inputMode="numeric"
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            onChange(digits ? new Intl.NumberFormat('pt-BR').format(parseInt(digits, 10)) : '')
          }}
          onBlur={() => {
            const digits = value.replace(/\D/g, '')
            if (digits) onChange(formatCurrencyBR(parseInt(digits, 10)))
          }}
        />
      ) : (
        <input
          type="text"
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

function navBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'var(--g-bg-surface)',
    border: '1px solid var(--g-border)',
    color: 'var(--g-text-muted)',
    borderRadius: 6,
    width: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  }
}
