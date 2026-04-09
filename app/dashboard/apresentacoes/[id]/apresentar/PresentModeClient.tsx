'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Slide, PresentationTheme } from '@/lib/presentations/types'
import SlideRenderer from '@/components/presentations/SlideRenderer'

interface Props {
  title: string
  slides: Slide[]
  theme: PresentationTheme
}

export default function PresentModeClient({ slides, theme }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const visibleSlides = slides.filter((s) => s.visible !== false)

  const prev = useCallback(() => setCurrentIdx((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setCurrentIdx((i) => Math.min(visibleSlides.length - 1, i + 1)), [visibleSlides.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      if (e.key === 'Escape') window.close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  const currentSlide = visibleSlides[currentIdx]
  if (!currentSlide) return null

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: '#000', zIndex: 9999 }}
    >
      {/* Slide fullscreen */}
      <div className="flex-1 relative">
        <SlideRenderer slide={currentSlide} theme={theme} />
      </div>

      {/* Controles overlay */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6">
        <button onClick={prev} disabled={currentIdx === 0}
          className="w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-20"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}>
          <ChevronLeft size={24} />
        </button>

        <div className="flex gap-1.5">
          {visibleSlides.map((_, i) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ backgroundColor: i === currentIdx ? theme.accent_color : 'rgba(255,255,255,0.4)' }} />
          ))}
        </div>

        <button onClick={next} disabled={currentIdx === visibleSlides.length - 1}
          className="w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-20"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}>
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Botão fechar */}
      <button onClick={() => window.close()}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}>
        <X size={18} />
      </button>

      {/* Contador */}
      <div className="absolute top-4 left-4 text-sm"
        style={{ color: 'rgba(255,255,255,0.4)' }}>
        {currentIdx + 1} / {visibleSlides.length}
      </div>
    </div>
  )
}
