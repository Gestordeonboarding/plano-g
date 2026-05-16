'use client'

/**
 * Renderiza UM slide do template baseado no seu type+layout.
 *
 * Recebe:
 *  - slide: { id, type, layout, background, title }
 *  - theme: { primary, background, font, style }
 *  - values: FieldValues do briefing (já processados)
 *
 * Despacha pro componente correto via SLIDE_COMPONENTS.
 * Não cuida de escala/proporção — quem cuida é o SlideStage que envolve.
 */

import { Slide, PresentationTheme, FieldValues } from '@/lib/presentations/types'
import { SLIDE_COMPONENTS } from './SlideTypes'

interface SlideRendererProps {
  slide: Slide
  theme: PresentationTheme
  values: FieldValues
}

export default function SlideRenderer({ slide, theme, values }: SlideRendererProps) {
  const Component = SLIDE_COMPONENTS[slide.type]

  if (!Component) {
    // Fallback genérico se vier um type desconhecido
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: theme.background,
          color: theme.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 24,
        }}
      >
        Tipo de slide desconhecido: <code style={{ marginLeft: 8 }}>{slide.type}</code>
      </div>
    )
  }

  return <Component slide={slide} theme={theme} values={values} />
}
