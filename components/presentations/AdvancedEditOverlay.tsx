'use client'

import { useEffect, useState, useRef } from 'react'
import Moveable from 'react-moveable'
import { SlideElement, CANVAS_W, CANVAS_H } from '@/lib/presentations/types'

/**
 * Overlay de edição avançada: usa react-moveable para permitir
 * drag/resize/rotate do elemento selecionado.
 *
 * O Moveable opera em coordenadas do DOM, mas como o canvas está em scale,
 * convertemos delta px → canvas units.
 */

interface Props {
  selectedElement: SlideElement | null
  /** Escala atual do canvas (DOM/canvas) */
  scale: number
  /** Container do canvas (referência DOM) */
  canvasContainer: HTMLElement | null
  onTransform: (id: string, transform: { x?: number; y?: number; w?: number; h?: number; rotation?: number }) => void
  onDelete: (id: string) => void
}

export default function AdvancedEditOverlay({ selectedElement, scale, canvasContainer, onTransform, onDelete }: Props) {
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!selectedElement || !canvasContainer) {
      setTarget(null)
      return
    }
    const el = canvasContainer.querySelector<HTMLElement>(`[data-element-id="${selectedElement.id}"]`)
    setTarget(el)
  }, [selectedElement, canvasContainer])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedElement) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const isInputFocused = ['INPUT', 'TEXTAREA'].includes((document.activeElement?.tagName || ''))
        if (!isInputFocused) {
          e.preventDefault()
          onDelete(selectedElement.id)
        }
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const isInputFocused = ['INPUT', 'TEXTAREA'].includes((document.activeElement?.tagName || ''))
        if (isInputFocused) return
        e.preventDefault()
        const step = e.shiftKey ? 20 : 4
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        onTransform(selectedElement.id, {
          x: clamp(selectedElement.x + dx, 0, CANVAS_W - selectedElement.w),
          y: clamp(selectedElement.y + dy, 0, CANVAS_H - selectedElement.h),
        })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedElement, onDelete, onTransform])

  if (!target || !selectedElement) return null

  return (
    <Moveable
      target={target}
      draggable
      resizable
      rotatable
      keepRatio={false}
      throttleDrag={0}
      throttleResize={0}
      throttleRotate={0}
      origin={false}
      onDrag={({ beforeTranslate }) => {
        // Não aplica direto no DOM — só usamos o final
        // Para feedback durante o drag, atualizar diretamente também
        target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) ${selectedElement.rotation ? `rotate(${selectedElement.rotation}deg)` : ''}`
      }}
      onDragEnd={({ lastEvent }) => {
        if (!lastEvent) return
        const dx = lastEvent.beforeTranslate[0] / scale
        const dy = lastEvent.beforeTranslate[1] / scale
        target.style.transform = ''
        onTransform(selectedElement.id, {
          x: Math.round(selectedElement.x + dx),
          y: Math.round(selectedElement.y + dy),
        })
      }}
      onResize={({ width, height, drag }) => {
        target.style.width = `${width}px`
        target.style.height = `${height}px`
        target.style.transform = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px) ${selectedElement.rotation ? `rotate(${selectedElement.rotation}deg)` : ''}`
      }}
      onResizeEnd={({ lastEvent }) => {
        if (!lastEvent) return
        const newW = Math.round(lastEvent.width / scale)
        const newH = Math.round(lastEvent.height / scale)
        const dx = lastEvent.drag.beforeTranslate[0] / scale
        const dy = lastEvent.drag.beforeTranslate[1] / scale
        target.style.transform = ''
        target.style.width = ''
        target.style.height = ''
        onTransform(selectedElement.id, {
          x: Math.round(selectedElement.x + dx),
          y: Math.round(selectedElement.y + dy),
          w: newW,
          h: newH,
        })
      }}
      onRotate={({ rotation }) => {
        target.style.transform = `rotate(${rotation}deg)`
      }}
      onRotateEnd={({ lastEvent }) => {
        if (!lastEvent) return
        target.style.transform = ''
        onTransform(selectedElement.id, { rotation: Math.round(lastEvent.rotation) })
      }}
    />
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
