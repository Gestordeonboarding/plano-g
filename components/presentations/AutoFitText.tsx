'use client'

/**
 * Texto que diminui o font-size proporcionalmente até caber na caixa.
 *
 * Funciona em 2 fases:
 *   1. Renderiza com o font-size desejado (props.fontSize).
 *   2. Mede o overflow real via ResizeObserver e diminui em passos de 5%
 *      até parar de transbordar OU bater no limite mínimo.
 *
 * Suporta tanto leitura única (texto fixo) quanto edição inline (re-checa
 * a cada keystroke).
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface AutoFitTextProps {
  text: string
  /** Tamanho desejado em px (ponto de partida) */
  fontSize: number
  /** Tamanho mínimo aceitável (default: 50% do desejado, mas nunca abaixo de 12px) */
  minFontSize?: number
  fontWeight?: number | string
  fontFamily?: string
  color?: string
  letterSpacing?: number | string
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right'
  uppercase?: boolean
  italic?: boolean
  /** Largura do container (px) */
  width: number
  /** Altura do container (px) */
  height: number
  /** Se true, permite quebrar palavras longas */
  breakWord?: boolean
}

export default function AutoFitText({
  text,
  fontSize,
  minFontSize,
  fontWeight,
  fontFamily,
  color,
  letterSpacing,
  lineHeight = 1.2,
  textAlign = 'left',
  uppercase,
  italic,
  width,
  height,
  breakWord = true,
}: AutoFitTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [scale, setScale] = useState(1)
  const minSize = minFontSize ?? Math.max(12, fontSize * 0.5)

  // Recalcula sempre que conteúdo / dimensão mudarem
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // Reset ao tamanho ideal antes de medir
    setScale(1)

    // Adia 1 frame pra DOM aplicar o reset
    requestAnimationFrame(() => {
      const measure = () => {
        const node = ref.current
        if (!node) return
        const overflowH = node.scrollHeight > height + 1
        const overflowW = node.scrollWidth > width + 1
        if (!overflowH && !overflowW) return

        // Calcula o fator necessário pra caber em ambos eixos
        const factorH = height / node.scrollHeight
        const factorW = width / node.scrollWidth
        const factor = Math.min(factorH, factorW) * 0.97 // 3% de respiro
        const newSize = Math.max(minSize, fontSize * factor)
        setScale(newSize / fontSize)
      }
      measure()
    })
  }, [text, fontSize, width, height, minSize])

  const effectiveSize = fontSize * scale

  return (
    <span
      ref={ref}
      style={{
        display: 'block',
        width: '100%',
        maxWidth: width,
        fontSize: effectiveSize,
        fontWeight,
        fontFamily,
        color,
        letterSpacing: typeof letterSpacing === 'number' ? `${letterSpacing}em` : letterSpacing,
        lineHeight,
        textAlign,
        textTransform: uppercase ? 'uppercase' : 'none',
        fontStyle: italic ? 'italic' : 'normal',
        wordBreak: breakWord ? 'break-word' : 'normal',
        overflowWrap: breakWord ? 'break-word' : 'normal',
        whiteSpace: 'pre-wrap',
      }}
    >
      {text}
    </span>
  )
}
