'use client'

/**
 * Container que mantém o canvas de slide em 1280×720 (16:9) e escala
 * proporcionalmente pra caber no espaço disponível, SEM cortar nada.
 *
 * Usar em todos os contextos de renderização:
 *   - mode="thumbnail"  → cards da biblioteca
 *   - mode="preview"    → editor (preview central)
 *   - mode="present"    → fullscreen (apresentação ao cliente)
 *
 * Pré-requisito: o container PAI precisa ter dimensões definidas
 * (height explícita ou flex com altura herdada).
 */

import { useEffect, useRef, useState } from 'react'
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/lib/presentations/types'

interface SlideStageProps {
  children: React.ReactNode
  mode: 'preview' | 'present' | 'thumbnail'
}

export function SlideStage({ children, mode }: SlideStageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    function calc() {
      const node = wrapperRef.current
      if (!node) return
      const w = node.clientWidth
      const h = node.clientHeight
      if (w === 0 || h === 0) return
      const scaleByW = w / SLIDE_WIDTH
      const scaleByH = h / SLIDE_HEIGHT
      setScale(Math.min(scaleByW, scaleByH))
    }

    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Modo thumbnail: ocupa width 100% com aspectRatio fixo ─────────────────
  if (mode === 'thumbnail') {
    return (
      <div
        ref={wrapperRef}
        style={{
          width: '100%',
          aspectRatio: `${SLIDE_WIDTH} / ${SLIDE_HEIGHT}`,
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '6px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    )
  }

  // ── Modos preview e present: ocupa 100% do pai, centraliza ────────────────
  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: mode === 'present' ? '#000' : 'transparent',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          transformOrigin: 'center center',
          transform: `scale(${scale})`,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}
