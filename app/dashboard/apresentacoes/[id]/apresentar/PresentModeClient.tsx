'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Slide, FieldValues, PresentationTheme, FieldDef } from '@/lib/presentations/types'
import { SlideStage } from '@/components/presentations/SlideStage'
import SlideRenderer from '@/components/presentations/SlideRenderer'
import { processFieldValues } from '@/lib/presentations/interpolate'

interface Props {
  title: string
  slides: Slide[]
  theme: PresentationTheme
  fieldValues: FieldValues
  fields: FieldDef[]
}

export default function PresentModeClient({ slides, theme, fieldValues, fields }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const visibleSlides = slides.filter((s) => s.visible !== false)

  const processedValues = processFieldValues(fieldValues, fields)

  const prev = useCallback(() => setCurrentIdx((i) => Math.max(0, i - 1)), [])
  const next = useCallback(
    () => setCurrentIdx((i) => Math.min(visibleSlides.length - 1, i + 1)),
    [visibleSlides.length],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        next()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      }
      if (e.key === 'Escape') window.close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  const currentSlide = visibleSlides[currentIdx]
  if (!currentSlide) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, minHeight: 0 }}>
        <SlideStage mode="present">
          <SlideRenderer slide={currentSlide} theme={theme} values={processedValues} />
        </SlideStage>
      </div>

      {/* Controles */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <button
          onClick={prev}
          disabled={currentIdx === 0}
          style={controlBtn(currentIdx === 0)}
        >
          <ChevronLeft size={22} />
        </button>

        <div style={{ display: 'flex', gap: 6 }}>
          {visibleSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: i === currentIdx ? theme.primary : 'rgba(255,255,255,0.35)',
                transition: 'background 0.15s',
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={currentIdx === visibleSlides.length - 1}
          style={controlBtn(currentIdx === visibleSlides.length - 1)}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <button
        onClick={() => window.close()}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={18} />
      </button>

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          fontSize: 13,
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {currentIdx + 1} / {visibleSlides.length}
      </div>
    </div>
  )
}

function controlBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.25 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}
