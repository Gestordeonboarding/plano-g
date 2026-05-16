'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Slide, FieldValues, PresentationTheme, FieldDef,
} from '@/lib/presentations/types'
import { SlideStage } from '@/components/presentations/SlideStage'
import SlideRenderer from '@/components/presentations/SlideRenderer'
import { processFieldValues } from '@/lib/presentations/interpolate'

interface Props {
  shareToken: string
  title: string
  slides: Slide[]
  theme: PresentationTheme
  fieldValues: FieldValues
  fields: FieldDef[]
  tenantName: string
  sellerPhone: string | null
}

export default function PublicPresentation({
  shareToken,
  title,
  slides,
  theme,
  fieldValues,
  fields,
  tenantName,
  sellerPhone,
}: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const visibleSlides = slides.filter((s) => s.visible !== false)
  const processedValues = processFieldValues(fieldValues, fields)

  useEffect(() => {
    fetch(`/api/presentations/view/${shareToken}`, { method: 'POST' }).catch(() => {})
  }, [shareToken])

  const prev = useCallback(() => setCurrentIdx((i) => Math.max(0, i - 1)), [])
  const next = useCallback(
    () => setCurrentIdx((i) => Math.min(visibleSlides.length - 1, i + 1)),
    [visibleSlides.length],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  const currentSlide = visibleSlides[currentIdx]
  if (!currentSlide) return null

  const waPhoneNumber = sellerPhone?.replace(/\D/g, '') || ''
  const waUrl = waPhoneNumber
    ? `https://wa.me/55${waPhoneNumber}?text=${encodeURIComponent(`Olá! Vi a apresentação "${title}" e quero saber mais.`)}`
    : null

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.background,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: theme.primary }}>{tenantName}</span>
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 8,
              background: '#25D366',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <MessageCircle size={14} /> Falar com consultor
          </a>
        )}
      </header>

      {/* Slide */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1100,
            aspectRatio: '16 / 9',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <SlideStage mode="preview">
            <SlideRenderer slide={currentSlide} theme={theme} values={processedValues} />
          </SlideStage>
        </div>

        {/* Navegação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 24 }}>
          <button
            onClick={prev}
            disabled={currentIdx === 0}
            style={ctrlBtn(currentIdx === 0)}
          >
            <ChevronLeft size={18} />
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
            {visibleSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  background: i === currentIdx ? theme.primary : 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </div>

          <button
            onClick={next}
            disabled={currentIdx === visibleSlides.length - 1}
            style={ctrlBtn(currentIdx === visibleSlides.length - 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>
          {currentIdx + 1} / {visibleSlides.length}
        </p>
      </div>
    </div>
  )
}

function ctrlBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.3 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}
