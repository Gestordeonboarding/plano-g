'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Lucide from 'lucide-react'
import {
  Slide, SlideElement, TextElement, ShapeElement, IconElement,
  ImageElement, LogoAdminElement, LogoCompanyElement, StatCardElement, ListItemElement,
  ComparisonElement, TimelineStepElement, MockupElement, BadgeElement,
  PresentationCustomization, ElementAnimation, CANVAS_W, CANVAS_H,
} from '@/lib/presentations/types'
import { resolveColor, resolveColorAlpha, FONT_STACK } from '@/lib/presentations/colors'
import { getPalette } from '@/lib/presentations/admin-colors'
import { getTheme, themeBackgroundCss, Theme } from '@/lib/presentations/themes'
import PlanoGMockup from './PlanoGMockups'
import BackgroundPattern from './BackgroundPattern'
import Ornament from './Ornament'

// ============================================================================
//  Animação por elemento (Framer Motion)
// ============================================================================

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1]
const EASE_REVEAL: [number, number, number, number] = [0.65, 0, 0.35, 1]

function variantsFor(animation: ElementAnimation | undefined, speed: number) {
  if (!animation || animation.type === 'none') {
    return { hidden: { opacity: 1 }, visible: { opacity: 1 } }
  }
  const dur = (animation.duration ?? 600) / 1000 / speed
  const delay = animation.delay / 1000 / speed

  switch (animation.type) {
    case 'fade':
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: dur, delay, ease: EASE_OUT_EXPO } },
      }
    case 'slide-up':
      return {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: dur, delay, ease: EASE_OUT_EXPO } },
      }
    case 'slide-down':
      return {
        hidden: { opacity: 0, y: -30 },
        visible: { opacity: 1, y: 0, transition: { duration: dur, delay, ease: EASE_OUT_EXPO } },
      }
    case 'slide-left':
      return {
        hidden: { opacity: 0, x: 40 },
        visible: { opacity: 1, x: 0, transition: { duration: dur, delay, ease: EASE_OUT_EXPO } },
      }
    case 'slide-right':
      return {
        hidden: { opacity: 0, x: -40 },
        visible: { opacity: 1, x: 0, transition: { duration: dur, delay, ease: EASE_OUT_EXPO } },
      }
    case 'zoom':
      return {
        hidden: { opacity: 0, scale: 0.85 },
        visible: { opacity: 1, scale: 1, transition: { duration: dur, delay, ease: EASE_OUT_EXPO } },
      }
    case 'pop':
      return {
        hidden: { opacity: 0, scale: 0.4 },
        visible: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 220, damping: 18, delay } },
      }
    case 'reveal':
      return {
        hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        visible: {
          opacity: 1,
          clipPath: 'inset(0 0% 0 0)',
          transition: { duration: dur * 1.2, delay, ease: EASE_REVEAL },
        },
      }
    default:
      return { hidden: { opacity: 1 }, visible: { opacity: 1 } }
  }
}

// ============================================================================
//  Hook: ResizeObserver para descobrir o scale do canvas
// ============================================================================

function useFit(ref: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      const sx = r.width / CANVAS_W
      const sy = r.height / CANVAS_H
      setScale(Math.min(sx, sy))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return scale
}

// ============================================================================
//  Background do slide
// ============================================================================

function SlideBackground({
  slide, c, theme,
}: {
  slide: Slide
  c: PresentationCustomization
  theme: Theme
}) {
  const bg = slide.background

  // 'theme' → bg vem 100% do theme atual (radial + pattern + grain)
  if (bg.type === 'theme') {
    return (
      <>
        <div className="absolute inset-0" style={{ backgroundImage: themeBackgroundCss(theme) }} />
        <BackgroundPattern theme={theme} />
      </>
    )
  }

  if (bg.type === 'radial') {
    const c1 = resolveColor(bg.color, c)
    const c2 = bg.color2 ? resolveColor(bg.color2, c) : c1
    return (
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `radial-gradient(ellipse at center, ${c2} 0%, ${c1} 100%)` }}
      />
    )
  }

  let style: React.CSSProperties = {}
  if (bg.type === 'solid') {
    style = { backgroundColor: resolveColor(bg.color, c) }
  } else if (bg.type === 'gradient') {
    const c1 = resolveColor(bg.color, c)
    const c2 = bg.color2 ? resolveColor(bg.color2, c) : c1
    style = { backgroundImage: `linear-gradient(${bg.angle ?? 135}deg, ${c1}, ${c2})` }
  }
  return <div className="absolute inset-0" style={style} />
}

// ============================================================================
//  Resolução de fonte por elemento (display p/ headings, body p/ resto)
// ============================================================================

function fontFor(
  elementType: SlideElement['type'],
  c: PresentationCustomization,
  theme: Theme,
): string {
  // Heading & subheading usam display do theme
  if (elementType === 'heading' || elementType === 'subheading') {
    return FONT_STACK[theme.typography.display] || FONT_STACK.inter
  }
  // Demais usam body do theme (fallback p/ c.font legacy)
  return FONT_STACK[theme.typography.body] || FONT_STACK[theme.typography.body] || FONT_STACK.inter
}

// ============================================================================
//  Elementos
// ============================================================================

function TextEl({
  el, c, theme, isEditing, onClick, editingText, onTextChange,
}: {
  el: TextElement
  c: PresentationCustomization
  theme: Theme
  isEditing: boolean
  onClick?: () => void
  editingText?: string | null
  onTextChange?: (v: string) => void
}) {
  const color = resolveColor(el.color, c)
  const family = fontFor(el.type, c, theme)
  const align = el.textAlign

  const textValue = editingText !== undefined && editingText !== null
    ? editingText
    : (el.content || el.placeholder || '')

  const baseStyle: React.CSSProperties = {
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    color,
    textAlign: align,
    fontStyle: el.italic ? 'italic' : 'normal',
    textTransform: el.uppercase ? 'uppercase' : 'none',
    letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
    lineHeight: el.lineHeight ?? 1.2,
    fontFamily: family,
    width: '100%', height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
    overflow: 'hidden',
    wordBreak: 'break-word',
  }

  if (isEditing && onTextChange) {
    return (
      <textarea
        autoFocus
        value={editingText ?? ''}
        onChange={(e) => onTextChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...baseStyle,
          background: 'rgba(0,212,200,0.08)',
          border: '2px solid #00D4C8',
          borderRadius: 6,
          padding: 4,
          resize: 'none',
          outline: 'none',
        }}
      />
    )
  }

  return (
    <div
      onClick={onClick}
      style={{ ...baseStyle, cursor: onClick ? 'text' : 'default' }}
    >
      <span style={{ width: '100%' }}>{textValue}</span>
    </div>
  )
}

function ShapeEl({ el, c }: { el: ShapeElement; c: PresentationCustomization }) {
  const fill = resolveColor(el.fill, c)
  const opacity = el.opacity ?? 1
  const radius = el.shape === 'circle'
    ? '50%'
    : el.borderRadius !== undefined ? `${el.borderRadius}px` : '0'

  if (el.shape === 'rect' || el.shape === 'circle') {
    return (
      <div style={{
        width: '100%', height: '100%',
        backgroundColor: fill,
        opacity,
        borderRadius: radius,
      }} />
    )
  }

  if (el.shape === 'line') {
    return <div style={{ width: '100%', height: '100%', backgroundColor: fill, opacity }} />
  }

  if (el.shape === 'blob') {
    return (
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', opacity }}>
        <path d="M40,20 Q90,0 130,20 T180,80 Q200,130 160,170 T80,190 Q20,180 10,120 T40,20Z" fill={fill} />
      </svg>
    )
  }

  if (el.shape === 'triangle') {
    return (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', opacity }}>
        <polygon points="50,5 95,95 5,95" fill={fill} />
      </svg>
    )
  }

  if (el.shape === 'arrow') {
    return (
      <svg viewBox="0 0 100 30" style={{ width: '100%', height: '100%', opacity }}>
        <path d="M0,15 L80,15 L80,5 L100,15 L80,25 L80,15" fill={fill} stroke={fill} strokeWidth="2" />
      </svg>
    )
  }

  return null
}

function IconEl({ el, c }: { el: IconElement; c: PresentationCustomization }) {
  const color = resolveColor(el.color, c)
  // Lucide icons são exportados em PascalCase
  const Icon = (Lucide as unknown as Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>)[el.icon]
  if (!Icon) return null
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={Math.min(el.w, el.h)} color={color} strokeWidth={el.strokeWidth ?? 2} />
    </div>
  )
}

function ImageEl({ el, c, isEditing, onClick }: { el: ImageElement; c: PresentationCustomization; isEditing?: boolean; onClick?: () => void }) {
  if (el.src) {
    return (
      <img src={el.src} alt="" onClick={onClick}
        style={{ width: '100%', height: '100%', objectFit: el.fit, borderRadius: el.borderRadius }} />
    )
  }
  return (
    <div onClick={onClick} style={{
      width: '100%', height: '100%',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: el.borderRadius,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(255,255,255,0.4)', fontSize: 14,
      cursor: onClick ? 'pointer' : 'default',
      border: '2px dashed rgba(255,255,255,0.15)',
    }}>
      {isEditing ? '+ Adicionar imagem' : '🖼️'}
    </div>
  )
}

function LogoAdminEl({ el, c, theme }: { el: LogoAdminElement; c: PresentationCustomization; theme: Theme }) {
  const palette = getPalette(c.admin_id)
  const color = el.color ? resolveColor(el.color, c) : palette.primary
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
      gap: 12, fontFamily: FONT_STACK[theme.typography.body],
    }}>
      <div style={{
        width: '60%', maxWidth: 60, aspectRatio: '1', borderRadius: 8,
        backgroundColor: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: palette.text_on_primary, fontWeight: 800, fontSize: 16,
      }}>
        {palette.short.slice(0, 1)}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 800, letterSpacing: 1,
        color: '#fff',
      }}>
        {palette.name}
      </div>
    </div>
  )
}

function LogoCompanyEl({ el, c, theme }: { el: LogoCompanyElement; c: PresentationCustomization; theme: Theme }) {
  // Se a empresa subiu logo, usa a imagem direto
  const src = el.src ?? c.company_logo_url
  if (src) {
    return (
      <img src={src} alt={c.company_name || ''}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  }
  // Watermark sem logo real: não renderiza nada (evita "SUA EMPRESA" gigante e fadeado).
  const isWatermark = (el.opacity ?? 1) < 0.2
  if (isWatermark) return null

  // Fallback: placeholder com nome da empresa em caixa-alta — só pra logos no foreground.
  const name = c.company_name?.trim() || 'SUA EMPRESA'
  // Tamanho da fonte do placeholder escala com altura do elemento (cap pra não estourar)
  const fs = Math.min(64, Math.max(18, el.h * 0.32))
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 12, fontFamily: FONT_STACK[theme.typography.display],
      color: theme.palette.text,
      fontWeight: 700,
      fontSize: fs,
      letterSpacing: `${theme.typography.headingTracking}em`,
      textTransform: 'uppercase',
      border: `1px solid ${theme.palette.accent}`,
      borderRadius: theme.cards.radius,
      padding: '12px 28px',
      textAlign: 'center',
    }}>
      {name}
    </div>
  )
}

function StatCardEl({ el, c, theme, isEditing, onClick, editingText, onTextChange }: {
  el: StatCardElement
  c: PresentationCustomization
  theme: Theme
  isEditing?: boolean
  onClick?: () => void
  editingText?: string | null
  onTextChange?: (v: string) => void
}) {
  const bg = resolveColor(el.bg, c)
  const valueColor = resolveColor(el.valueColor, c)
  const labelColor = resolveColor(el.labelColor, c)
  const Icon = el.icon ? (Lucide as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[el.icon] : null

  return (
    <div
      onClick={onClick}
      style={{
        width: '100%', height: '100%',
        backgroundColor: bg === 'transparent' ? 'transparent' : bg,
        borderRadius: 16,
        padding: 24,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        cursor: onClick ? 'text' : 'default',
        fontFamily: FONT_STACK[theme.typography.body],
      }}
    >
      {Icon && <Icon size={32} color={valueColor} />}
      <div>
        {isEditing && onTextChange ? (
          <input
            value={editingText ?? ''}
            onChange={(e) => onTextChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            style={{
              width: '100%', fontSize: 64, fontWeight: 800, color: valueColor,
              background: 'rgba(0,212,200,0.08)', border: '2px solid #00D4C8',
              borderRadius: 6, padding: 4, outline: 'none', fontFamily: 'inherit',
            }}
          />
        ) : (
          <div style={{ fontSize: 64, fontWeight: 800, color: valueColor, lineHeight: 1.05 }}>{el.value}</div>
        )}
        <div style={{ fontSize: 18, color: labelColor, marginTop: 8, textTransform: 'uppercase', letterSpacing: 2 }}>{el.label}</div>
      </div>
    </div>
  )
}

function ListItemEl({ el, c, theme, isEditing, onClick, editingText, onTextChange }: {
  el: ListItemElement
  c: PresentationCustomization
  theme: Theme
  isEditing?: boolean
  onClick?: () => void
  editingText?: string | null
  onTextChange?: (v: string) => void
}) {
  const bulletColor = resolveColor(el.bulletColor, c)
  const textColor = resolveColor(el.textColor, c)

  return (
    <div onClick={onClick} style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', gap: 16,
      cursor: onClick ? 'text' : 'default',
      fontFamily: FONT_STACK[theme.typography.body],
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        backgroundColor: el.bullet === 'check' || el.bullet === 'star' || el.bullet === 'arrow' ? `${bulletColor}33` : bulletColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: el.bullet === 'check' || el.bullet === 'star' || el.bullet === 'arrow' ? bulletColor : '#fff',
        fontSize: 16, fontWeight: 700,
      }}>
        {el.bullet === 'check' && <Lucide.Check size={20} strokeWidth={3} />}
        {el.bullet === 'star' && <Lucide.Star size={20} fill={bulletColor} strokeWidth={0} />}
        {el.bullet === 'arrow' && <Lucide.ArrowRight size={20} strokeWidth={3} />}
        {el.bullet === 'number' && (el.bulletNumber ?? '•')}
        {el.bullet === 'dot' && '•'}
      </div>
      {isEditing && onTextChange ? (
        <input
          value={editingText ?? ''}
          onChange={(e) => onTextChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoFocus
          style={{
            flex: 1, fontSize: el.fontSize, color: textColor, fontWeight: 500,
            background: 'rgba(0,212,200,0.08)', border: '2px solid #00D4C8',
            borderRadius: 6, padding: 4, outline: 'none', fontFamily: 'inherit',
          }}
        />
      ) : (
        <div style={{ fontSize: el.fontSize, color: textColor, fontWeight: 500, flex: 1 }}>{el.text}</div>
      )}
    </div>
  )
}

function MockupEl({ el, c }: { el: MockupElement; c: PresentationCustomization }) {
  const palette = getPalette(c.admin_id)
  const accent = el.accent ? resolveColor(el.accent, c) : palette.primary
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <PlanoGMockup kind={el.mockup} accent={accent} />
    </div>
  )
}

function BadgeEl({ el, c, theme, isEditing, onClick, editingText, onTextChange }: {
  el: BadgeElement
  c: PresentationCustomization
  theme: Theme
  isEditing?: boolean
  onClick?: () => void
  editingText?: string | null
  onTextChange?: (v: string) => void
}) {
  const bg = resolveColor(el.bg, c)
  const color = resolveColor(el.color, c)
  return (
    <div onClick={onClick} style={{
      width: '100%', height: '100%',
      backgroundColor: bg, color,
      borderRadius: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: el.fontSize, fontWeight: 800,
      textTransform: el.uppercase ? 'uppercase' : 'none',
      letterSpacing: el.uppercase ? 2 : 0,
      cursor: onClick ? 'text' : 'default',
      padding: '0 16px',
      fontFamily: FONT_STACK[theme.typography.body],
    }}>
      {isEditing && onTextChange ? (
        <input
          value={editingText ?? ''}
          onChange={(e) => onTextChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoFocus
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit',
            textAlign: 'center', width: '100%', textTransform: 'inherit',
            letterSpacing: 'inherit', fontFamily: 'inherit',
          }}
        />
      ) : el.text}
    </div>
  )
}

function ComparisonEl({ el, c, theme }: { el: ComparisonElement; c: PresentationCustomization; theme: Theme }) {
  const isGood = el.side === 'good'
  const bg = isGood ? resolveColor('primary', c) : '#3a1a1a'
  const text = isGood ? resolveColor('on-primary', c) : '#fff'
  return (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: bg, borderRadius: 24, padding: 32,
      display: 'flex', flexDirection: 'column', gap: 16,
      fontFamily: FONT_STACK[theme.typography.body],
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 4, color: text, opacity: 0.7 }}>
        {el.label}
      </div>
      <div style={{ fontSize: 64, fontWeight: 800, color: text }}>{el.value}</div>
      {el.description && <div style={{ fontSize: 22, color: text, opacity: 0.85, lineHeight: 1.4 }}>{el.description}</div>}
    </div>
  )
}

function TimelineStepEl({ el, c, theme }: { el: TimelineStepElement; c: PresentationCustomization; theme: Theme }) {
  const bg = resolveColor(el.bgColor, c)
  const text = resolveColor(el.textColor, c)
  const accent = resolveColor('primary', c)
  return (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: bg, borderRadius: 16, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 8,
      fontFamily: FONT_STACK[theme.typography.body],
    }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>
        {el.step}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: text }}>{el.title}</div>
      {el.description && <div style={{ fontSize: 16, color: text, opacity: 0.7, lineHeight: 1.4 }}>{el.description}</div>}
    </div>
  )
}

// ============================================================================
//  Element wrapper (animação + posicionamento)
// ============================================================================

interface ElementProps {
  el: SlideElement
  c: PresentationCustomization
  theme: Theme
  /** Permite edição inline */
  editable?: boolean
  /** ID do elemento sendo editado agora (text inline) */
  editingId?: string | null
  /** Texto temporário do elemento em edição */
  editingDraft?: string | null
  /** Quando o usuário clica num elemento editável */
  onElementClick?: (el: SlideElement) => void
  /** Quando o draft de texto muda */
  onDraftChange?: (v: string) => void
  /** Animar (false em modo edição estática) */
  animate?: boolean
  speed?: number
  /** Está selecionado no editor avançado */
  selected?: boolean
}

function ElementBox({ el, c, theme, editable, editingId, editingDraft, onElementClick, onDraftChange, animate = true, speed = 1, selected }: ElementProps) {
  if (el.hidden) return null

  const isEditing = editingId === el.id
  const variants = useMemo(() => variantsFor(el.animation, speed), [el.animation, speed])

  const style: React.CSSProperties = {
    position: 'absolute',
    left: el.x, top: el.y,
    width: el.w, height: el.h,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    zIndex: el.z ?? 1,
    opacity: el.opacity,
    outline: selected ? `2px solid ${theme.palette.accent}` : 'none',
    outlineOffset: 4,
  }

  const handleClick = editable && !el.locked ? () => onElementClick?.(el) : undefined

  let inner: React.ReactNode = null

  if (el.type === 'heading' || el.type === 'subheading' || el.type === 'text' || el.type === 'caption') {
    inner = <TextEl
      el={el} c={c} theme={theme} isEditing={isEditing}
      onClick={handleClick}
      editingText={isEditing ? editingDraft : null}
      onTextChange={onDraftChange}
    />
  } else if (el.type === 'shape') {
    inner = <ShapeEl el={el} c={c} />
  } else if (el.type === 'icon') {
    inner = <IconEl el={el} c={c} />
  } else if (el.type === 'image') {
    inner = <ImageEl el={el} c={c} isEditing={editable} onClick={handleClick} />
  } else if (el.type === 'logo-admin') {
    inner = <LogoAdminEl el={el} c={c} theme={theme} />
  } else if (el.type === 'logo-company') {
    inner = <LogoCompanyEl el={el} c={c} theme={theme} />
  } else if (el.type === 'stat-card') {
    inner = <StatCardEl el={el} c={c} theme={theme} isEditing={isEditing} onClick={handleClick} editingText={isEditing ? editingDraft : null} onTextChange={onDraftChange} />
  } else if (el.type === 'list-item') {
    inner = <ListItemEl el={el} c={c} theme={theme} isEditing={isEditing} onClick={handleClick} editingText={isEditing ? editingDraft : null} onTextChange={onDraftChange} />
  } else if (el.type === 'mockup') {
    inner = <MockupEl el={el} c={c} />
  } else if (el.type === 'badge') {
    inner = <BadgeEl el={el} c={c} theme={theme} isEditing={isEditing} onClick={handleClick} editingText={isEditing ? editingDraft : null} onTextChange={onDraftChange} />
  } else if (el.type === 'comparison') {
    inner = <ComparisonEl el={el} c={c} theme={theme} />
  } else if (el.type === 'timeline-step') {
    inner = <TimelineStepEl el={el} c={c} theme={theme} />
  }

  if (!animate) {
    return (
      <div style={style} data-element-id={el.id}>{inner}</div>
    )
  }

  return (
    <motion.div
      style={style}
      data-element-id={el.id}
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {inner}
    </motion.div>
  )
}

// ============================================================================
//  Render principal
// ============================================================================

interface SlideRendererProps {
  slide: Slide
  customization: PresentationCustomization
  /** Renderizar com animações de entrada */
  animate?: boolean
  /** Permitir edição inline */
  editable?: boolean
  /** ID elemento sendo editado */
  editingId?: string | null
  editingDraft?: string | null
  selectedId?: string | null
  onElementClick?: (el: SlideElement) => void
  onDraftChange?: (v: string) => void
  /** Renderiza em escala 1:1 (sem ajuste) — usado para thumbnails sem ResizeObserver */
  fixedScale?: number
}

export default function SlideRenderer({
  slide, customization, animate = true, editable = false,
  editingId, editingDraft, selectedId, onElementClick, onDraftChange, fixedScale,
}: SlideRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const observedScale = useFit(containerRef)
  const scale = fixedScale !== undefined ? fixedScale : observedScale
  const speed = customization.animation_speed || 1
  const theme = getTheme(customization.theme_id)

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: theme.palette.bgOuter }}
    >
      <div
        className="absolute"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          left: 0, top: 0,
        }}
      >
        <SlideBackground slide={slide} c={customization} theme={theme} />
        {slide.elements.map((el) => (
          <ElementBox
            key={el.id}
            el={el}
            c={customization}
            theme={theme}
            editable={editable}
            editingId={editingId}
            editingDraft={editingDraft}
            onElementClick={onElementClick}
            onDraftChange={onDraftChange}
            animate={animate}
            speed={speed}
            selected={selectedId === el.id}
          />
        ))}
        {/* Ornamento-assinatura do theme — sempre por cima dos elementos */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <Ornament theme={theme} />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
//  Wrapper com transição entre slides (para o modo apresentação)
// ============================================================================

export function SlideShowTransition({
  slide, customization, transitionKey,
}: {
  slide: Slide
  customization: PresentationCustomization
  transitionKey: string | number
}) {
  const t = customization.transition

  const transitionVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { x: '100%', opacity: 0.5 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-30%', opacity: 0 },
    },
    zoom: {
      initial: { scale: 0.92, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 1.05, opacity: 0 },
    },
    flip: {
      initial: { rotateY: 90, opacity: 0 },
      animate: { rotateY: 0, opacity: 1 },
      exit: { rotateY: -90, opacity: 0 },
    },
    reveal: {
      initial: { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
      animate: { clipPath: 'inset(0 0% 0 0)', opacity: 1 },
      exit: { clipPath: 'inset(0 0 0 100%)', opacity: 0 },
    },
  }[t]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        className="absolute inset-0"
        initial={transitionVariants.initial}
        animate={transitionVariants.animate}
        exit={transitionVariants.exit}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <SlideRenderer slide={slide} customization={customization} animate />
      </motion.div>
    </AnimatePresence>
  )
}
