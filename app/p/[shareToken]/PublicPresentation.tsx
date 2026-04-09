'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Slide, PresentationTheme } from '@/lib/presentations/types'
import SlideRenderer from '@/components/presentations/SlideRenderer'

interface Props {
  shareToken: string
  title: string
  slides: Slide[]
  theme: PresentationTheme
  tenantName: string
  tenantColor: string
  sellerPhone: string | null
}

export default function PublicPresentation({ shareToken, title, slides, theme, tenantName, tenantColor, sellerPhone }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const visibleSlides = slides.filter((s) => s.visible !== false)

  // Registrar visualização
  useEffect(() => {
    fetch(`/api/presentations/view/${shareToken}`, { method: 'POST' }).catch(() => {})
  }, [shareToken])

  const prev = useCallback(() => setCurrentIdx((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setCurrentIdx((i) => Math.min(visibleSlides.length - 1, i + 1)), [visibleSlides.length])

  // Navegação por teclado
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'Space') next()
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0D1F1E' }}>
      {/* Header discreto */}
      <header className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <span className="font-bold text-sm" style={{ color: tenantColor }}>{tenantName}</span>
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ backgroundColor: '#25D366', color: '#fff' }}>
            <MessageCircle size={14} /> Falar com consultor
          </a>
        )}
      </header>

      {/* Slide */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
          <SlideRenderer slide={currentSlide} theme={theme} />
        </div>

        {/* Navegação */}
        <div className="flex items-center gap-6 mt-6">
          <button onClick={prev} disabled={currentIdx === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
            <ChevronLeft size={20} />
          </button>

          <div className="flex gap-1.5">
            {visibleSlides.map((_, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{ backgroundColor: i === currentIdx ? tenantColor : 'rgba(255,255,255,0.3)' }} />
            ))}
          </div>

          <button onClick={next} disabled={currentIdx === visibleSlides.length - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
            <ChevronRight size={20} />
          </button>
        </div>

        <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {currentIdx + 1} / {visibleSlides.length}
        </p>
      </div>
    </div>
  )
}
