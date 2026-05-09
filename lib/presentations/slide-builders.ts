/**
 * Builders dos 10 slide-types do módulo de apresentações Dark Tech Premium.
 *
 * Cada função recebe (theme, content) e devolve um `Slide` com elementos
 * posicionados no canvas 1920×1080. Os builders são THEME-AWARE — leem
 * font-scale, accent, surface, ornamento etc. do theme passado.
 *
 * Slides:
 *   1.  buildCapa
 *   2.  buildSobre
 *   3.  buildAlinhamento
 *   4.  buildTransicao
 *   5.  buildFases
 *   6.  buildFeaturesDuplo
 *   7.  buildCardsGrid
 *   8.  buildPricing
 *   9.  buildProcessoHorizontal
 *   10. buildProposta
 */

import {
  Slide, SlideElement, TextElement, ShapeElement, IconElement,
  ImageElement, BadgeElement, ListItemElement, StatCardElement,
  LogoCompanyElement, CANVAS_W, CANVAS_H,
} from './types'
import { Theme, hexAlpha } from './themes'

// ============================================================================
//  Helpers
// ============================================================================

let _idCounter = 0
const rid = (prefix = 'el') =>
  `${prefix}_${Date.now().toString(36)}_${(_idCounter++).toString(36)}`

const PADDING = 120

/** Cria um TextElement já normalizado pro tema (display vs body é resolvido no renderer). */
function txt(opts: {
  kind: 'heading' | 'subheading' | 'text' | 'caption'
  x: number; y: number; w: number; h: number
  content: string
  placeholder?: string
  fieldKey?: string
  fieldLabel?: string
  fontSize: number
  weight?: 300 | 400 | 500 | 600 | 700 | 800 | 900
  color: string
  align?: 'left' | 'center' | 'right'
  uppercase?: boolean
  italic?: boolean
  letterSpacing?: number
  lineHeight?: number
  delay?: number
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom' | 'pop' | 'reveal'
}): TextElement {
  return {
    id: rid('txt'),
    type: opts.kind,
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    content: opts.content,
    placeholder: opts.placeholder,
    fieldKey: opts.fieldKey,
    fieldLabel: opts.fieldLabel,
    fontSize: opts.fontSize,
    fontWeight: opts.weight ?? (opts.kind === 'heading' ? 800 : opts.kind === 'subheading' ? 600 : 400),
    color: opts.color,
    textAlign: opts.align ?? 'left',
    uppercase: opts.uppercase,
    italic: opts.italic,
    letterSpacing: opts.letterSpacing,
    lineHeight: opts.lineHeight,
    animation: opts.animation
      ? { type: opts.animation, delay: opts.delay ?? 0, duration: 700 }
      : { type: 'fade', delay: opts.delay ?? 0, duration: 600 },
  }
}

/** Card retangular (fundo + borda) — usa o estilo definido no theme. */
function card(opts: {
  x: number; y: number; w: number; h: number
  theme: Theme
  delay?: number
  variant?: 'surface' | 'transparent'
}): ShapeElement {
  const t = opts.theme
  const bg = opts.variant === 'transparent' ? 'transparent' : t.palette.surface
  const stroke = t.cards.borderUsesAccent ? t.palette.accent : hexAlpha(t.palette.text, 0.15)
  return {
    id: rid('card'),
    type: 'shape',
    shape: 'rect',
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    fill: bg,
    stroke,
    strokeWidth: t.cards.borderWidth,
    borderRadius: t.cards.radius,
    animation: { type: 'fade', delay: opts.delay ?? 0, duration: 600 },
  }
}

function icon(opts: {
  x: number; y: number; w: number; h: number
  name: string
  color: string
  strokeWidth?: number
  delay?: number
}): IconElement {
  return {
    id: rid('ico'),
    type: 'icon',
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    icon: opts.name,
    color: opts.color,
    strokeWidth: opts.strokeWidth ?? 1.6,
    animation: { type: 'zoom', delay: opts.delay ?? 0, duration: 500 },
  }
}

function shape(opts: {
  kind: 'rect' | 'circle' | 'line' | 'blob' | 'triangle' | 'arrow'
  x: number; y: number; w: number; h: number
  fill: string
  opacity?: number
  borderRadius?: number
  delay?: number
  animation?: 'fade' | 'slide-up' | 'reveal'
}): ShapeElement {
  return {
    id: rid('sh'),
    type: 'shape',
    shape: opts.kind,
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    fill: opts.fill,
    opacity: opts.opacity,
    borderRadius: opts.borderRadius,
    animation: { type: opts.animation ?? 'fade', delay: opts.delay ?? 0, duration: 500 },
  }
}

function img(opts: {
  x: number; y: number; w: number; h: number
  src: string | null
  fit?: 'cover' | 'contain'
  borderRadius?: number
  fieldKey?: string
  fieldLabel?: string
  delay?: number
}): ImageElement {
  return {
    id: rid('img'),
    type: 'image',
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    src: opts.src,
    fit: opts.fit ?? 'cover',
    borderRadius: opts.borderRadius,
    fieldKey: opts.fieldKey,
    fieldLabel: opts.fieldLabel,
    animation: { type: 'fade', delay: opts.delay ?? 0, duration: 600 },
  }
}

function logoCompany(opts: {
  x: number; y: number; w: number; h: number
  delay?: number
}): LogoCompanyElement {
  return {
    id: rid('logo'),
    type: 'logo-company',
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    src: null,
    fieldKey: 'company_logo_url',
    animation: { type: 'fade', delay: opts.delay ?? 0, duration: 500 },
  }
}

function badge(opts: {
  x: number; y: number; w: number; h: number
  text: string
  bg: string
  color: string
  fontSize?: number
  uppercase?: boolean
  fieldKey?: string
  delay?: number
}): BadgeElement {
  return {
    id: rid('bdg'),
    type: 'badge',
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    text: opts.text,
    bg: opts.bg,
    color: opts.color,
    fontSize: opts.fontSize ?? 16,
    uppercase: opts.uppercase ?? true,
    animation: { type: 'pop', delay: opts.delay ?? 0, duration: 500 },
  }
}

function listItem(opts: {
  x: number; y: number; w: number; h: number
  bullet: 'check' | 'number' | 'dot' | 'arrow' | 'star'
  bulletNumber?: number
  text: string
  bulletColor: string
  textColor: string
  fontSize?: number
  delay?: number
}): ListItemElement {
  return {
    id: rid('li'),
    type: 'list-item',
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    bullet: opts.bullet,
    bulletNumber: opts.bulletNumber,
    text: opts.text,
    bulletColor: opts.bulletColor,
    textColor: opts.textColor,
    fontSize: opts.fontSize ?? 22,
    animation: { type: 'slide-right', delay: opts.delay ?? 0, duration: 500 },
  }
}

// Aplica scale do theme em headings (Onyx & Gold = 1.15x; Bebas = 1.25x; Mono = 1.30x)
function scaled(theme: Theme, base: number): number {
  return Math.round(base * theme.typography.displayScale)
}

// ============================================================================
//  Builder 1: CAPA
// ============================================================================

export interface CapaContent {
  /** Texto pequeno acima do logo. Ex: "SEJA BEM VINDO" */
  welcomeText?: string
  /** Título principal — pode ter quebra de linha (\n) */
  title: string
  /** fieldKey p/ tornar editável via briefing */
  titleFieldKey?: string
}

export function buildCapa(theme: Theme, content: CapaContent): Slide {
  const t = theme
  const elements: SlideElement[] = []

  // ── Watermark gigante do logo (atrás de tudo, baixíssima opacidade) ─────
  // Usa logo-company com opacity reduzida pra criar marca-d'água sutil
  elements.push({
    ...logoCompany({
      x: (CANVAS_W - 1200) / 2, y: (CANVAS_H - 600) / 2,
      w: 1200, h: 600,
      delay: 0,
    }),
    opacity: 0.05,
    z: 0,
  })

  // ── Welcome text (caption acima do logo principal) ──────────────────────
  if (content.welcomeText) {
    elements.push(txt({
      kind: 'caption',
      x: 0, y: 220, w: CANVAS_W, h: 32,
      content: content.welcomeText,
      fontSize: 18,
      weight: 500,
      color: t.palette.textMuted,
      align: 'center',
      uppercase: true,
      letterSpacing: t.typography.labelTracking * 16,
      delay: 100,
      animation: 'fade',
    }))
  }

  // ── Logo principal — grande, em destaque ────────────────────────────────
  elements.push(logoCompany({
    x: (CANVAS_W - 560) / 2, y: 290, w: 560, h: 240,
    delay: 200,
  }))

  // ── Linha decorativa fina abaixo do logo (separa logo do título) ────────
  elements.push(shape({
    kind: 'rect',
    x: (CANVAS_W - 80) / 2, y: 580, w: 80, h: 1,
    fill: t.palette.accent,
    opacity: 0.6,
    delay: 320,
  }))

  // ── Título principal — 2 linhas, accent ─────────────────────────────────
  elements.push(txt({
    kind: 'heading',
    x: PADDING, y: 660, w: CANVAS_W - PADDING * 2, h: 240,
    content: content.title,
    fieldKey: content.titleFieldKey,
    fieldLabel: 'Título da capa',
    fontSize: scaled(t, 80),
    weight: 800,
    color: t.palette.accent,
    align: 'center',
    uppercase: true,
    letterSpacing: t.typography.headingTracking * 16,
    lineHeight: 1.05,
    delay: 400,
    animation: 'slide-up',
  }))

  return {
    id: rid('slide-capa'),
    kind: 'cover',
    title: 'Capa',
    background: { type: 'theme', color: 'dark' },
    elements,
    visible: true,
  }
}

// ============================================================================
//  Builder 2: SOBRE / EMPRESA (60/40)
// ============================================================================

export interface SobreContent {
  smallLabel?: string         // ex: "SOBRE NÓS"
  heading: string             // "SOMOS A [EMPRESA]"
  paragraph: string
  stats: Array<{ value: string; label: string }>
  ctaFooter?: string
  /** URL imagem hero (40%) */
  imageUrl?: string | null
}

export function buildSobre(theme: Theme, content: SobreContent): Slide {
  const t = theme
  const elements: SlideElement[] = []

  // ── Lado esquerdo (60%) ────────────────────────────────────────────────
  const leftW = 1080
  const leftX = PADDING

  if (content.smallLabel) {
    elements.push(txt({
      kind: 'caption',
      x: leftX, y: 120, w: leftW, h: 28,
      content: content.smallLabel,
      fontSize: 16, weight: 600,
      color: t.palette.accent,
      uppercase: true,
      letterSpacing: t.typography.labelTracking * 16,
      delay: 100, animation: 'fade',
    }))
  }

  elements.push(txt({
    kind: 'heading',
    x: leftX, y: 180, w: leftW, h: 200,
    content: content.heading,
    fieldKey: 'company_name', fieldLabel: 'Nome da empresa',
    fontSize: scaled(t, 76),
    weight: 800,
    color: t.palette.accent,
    uppercase: true,
    letterSpacing: t.typography.headingTracking * 16,
    lineHeight: 1.05,
    delay: 200, animation: 'slide-up',
  }))

  elements.push(txt({
    kind: 'text',
    x: leftX, y: 420, w: leftW - 60, h: 200,
    content: content.paragraph,
    fieldKey: 'company_about', fieldLabel: 'Sobre a empresa',
    fontSize: 22, weight: 400,
    color: t.palette.textMuted,
    lineHeight: 1.55,
    delay: 350, animation: 'fade',
  }))

  // Stats pills — 3 deles em linha
  const pillW = 240
  const pillGap = 24
  const pillsY = 680
  content.stats.slice(0, 3).forEach((s, i) => {
    const px = leftX + i * (pillW + pillGap)
    // Pill border (transparente) + texto dentro
    elements.push(card({
      x: px, y: pillsY, w: pillW, h: 92,
      theme: t, variant: 'transparent', delay: 500 + i * 100,
    }))
    elements.push(txt({
      kind: 'subheading',
      x: px, y: pillsY + 14, w: pillW, h: 40,
      content: s.value,
      fontSize: 32, weight: 800,
      color: t.palette.accent,
      align: 'center',
      delay: 550 + i * 100, animation: 'pop',
    }))
    elements.push(txt({
      kind: 'caption',
      x: px, y: pillsY + 56, w: pillW, h: 24,
      content: s.label,
      fontSize: 12, weight: 500,
      color: t.palette.textMuted,
      align: 'center',
      uppercase: true,
      letterSpacing: t.typography.labelTracking * 12,
      delay: 600 + i * 100, animation: 'fade',
    }))
  })

  if (content.ctaFooter) {
    elements.push(txt({
      kind: 'text',
      x: leftX, y: 880, w: leftW, h: 40,
      content: content.ctaFooter,
      fontSize: 18, weight: 500,
      color: t.palette.text,
      italic: true,
      delay: 850, animation: 'fade',
    }))
  }

  // ── Lado direito (40%) — imagem com overlay ─────────────────────────────
  const rightX = 1280
  const rightW = CANVAS_W - rightX - PADDING + 40 // ~560

  elements.push(img({
    x: rightX, y: 80, w: rightW, h: CANVAS_H - 160,
    src: content.imageUrl ?? null,
    borderRadius: t.cards.radius * 2,
    fieldKey: 'seller_photo',
    fieldLabel: 'Foto do vendedor / hero',
    delay: 250,
  }))
  // overlay gradiente leve do escuro pro transparente (legibilidade)
  elements.push(shape({
    kind: 'rect',
    x: rightX, y: 80, w: rightW, h: CANVAS_H - 160,
    fill: hexAlpha(t.palette.bgOuter, 0.35),
    borderRadius: t.cards.radius * 2,
    delay: 350,
  }))

  return {
    id: rid('slide-sobre'),
    kind: 'apresentacao',
    title: 'Sobre',
    background: { type: 'theme', color: 'dark' },
    elements,
    visible: true,
  }
}

// ============================================================================
//  Builder 3: ALINHAMENTO (✓ / ✗)
// ============================================================================

export interface AlinhamentoContent {
  heading: string
  subheading?: string
  positives: string[]   // até 5
  negatives: string[]   // até 5
  positiveLabel?: string  // ex: "O QUE FAZEMOS"
  negativeLabel?: string  // ex: "O QUE NÃO FAZEMOS"
}

export function buildAlinhamento(theme: Theme, content: AlinhamentoContent): Slide {
  const t = theme
  const elements: SlideElement[] = []

  // Título central
  elements.push(txt({
    kind: 'heading',
    x: PADDING, y: 100, w: CANVAS_W - PADDING * 2, h: 100,
    content: content.heading,
    fontSize: scaled(t, 64),
    weight: 800,
    color: t.palette.accent,
    align: 'center',
    uppercase: true,
    letterSpacing: t.typography.headingTracking * 16,
    delay: 100, animation: 'slide-up',
  }))

  if (content.subheading) {
    elements.push(txt({
      kind: 'subheading',
      x: PADDING, y: 220, w: CANVAS_W - PADDING * 2, h: 50,
      content: content.subheading,
      fontSize: 22, weight: 400,
      color: t.palette.textMuted,
      align: 'center',
      delay: 200, animation: 'fade',
    }))
  }

  // ── Coluna esquerda (positivos) ────────────────────────────────────────
  const colW = 720
  const leftCol = (CANVAS_W / 2) - colW - 30
  const rightCol = (CANVAS_W / 2) + 30

  // Header label esquerda
  if (content.positiveLabel) {
    elements.push(txt({
      kind: 'caption',
      x: leftCol, y: 320, w: colW, h: 28,
      content: content.positiveLabel,
      fontSize: 14, weight: 700,
      color: t.palette.accent,
      align: 'left', uppercase: true,
      letterSpacing: t.typography.labelTracking * 14,
      delay: 250, animation: 'fade',
    }))
  }

  // Ícone ✓ grande
  elements.push(shape({
    kind: 'circle',
    x: leftCol, y: 360, w: 96, h: 96,
    fill: hexAlpha(t.palette.accent, 0.15),
    delay: 300, animation: 'fade',
  }))
  elements.push(icon({
    x: leftCol, y: 360, w: 96, h: 96,
    name: 'Check',
    color: t.palette.accent,
    strokeWidth: 3,
    delay: 350,
  }))

  content.positives.slice(0, 5).forEach((text, i) => {
    elements.push(listItem({
      x: leftCol, y: 500 + i * 76, w: colW, h: 64,
      bullet: 'check',
      text,
      bulletColor: t.palette.accent,
      textColor: t.palette.text,
      fontSize: 22,
      delay: 450 + i * 80,
    }))
  })

  // ── Coluna direita (negativos) ──────────────────────────────────────────
  if (content.negativeLabel) {
    elements.push(txt({
      kind: 'caption',
      x: rightCol, y: 320, w: colW, h: 28,
      content: content.negativeLabel,
      fontSize: 14, weight: 700,
      color: t.palette.negative,
      align: 'left', uppercase: true,
      letterSpacing: t.typography.labelTracking * 14,
      delay: 250, animation: 'fade',
    }))
  }

  elements.push(shape({
    kind: 'circle',
    x: rightCol, y: 360, w: 96, h: 96,
    fill: hexAlpha(t.palette.negative, 0.15),
    delay: 300, animation: 'fade',
  }))
  elements.push(icon({
    x: rightCol, y: 360, w: 96, h: 96,
    name: 'X',
    color: t.palette.negative,
    strokeWidth: 3,
    delay: 350,
  }))

  content.negatives.slice(0, 5).forEach((text, i) => {
    elements.push(listItem({
      x: rightCol, y: 500 + i * 76, w: colW, h: 64,
      bullet: 'arrow',
      text,
      bulletColor: t.palette.negative,
      textColor: t.palette.textMuted,
      fontSize: 22,
      delay: 450 + i * 80,
    }))
  })

  return {
    id: rid('slide-align'),
    kind: 'expectativas',
    title: 'Alinhamento',
    background: { type: 'theme', color: 'dark' },
    elements,
    visible: true,
  }
}

// ============================================================================
//  Builder 4: TRANSIÇÃO / SEÇÃO
// ============================================================================

export interface TransicaoContent {
  /** Texto gigante de baixa opacidade no fundo (ex: "02") */
  watermark?: string
  /** Pequeno badge no topo (ex: "METODOLOGIA") */
  topBadge?: string
  /** Nome da seção centralizado */
  sectionName: string
  /** Ícone Lucide centralizado */
  iconName?: string
  tagline?: string
}

export function buildTransicao(theme: Theme, content: TransicaoContent): Slide {
  const t = theme
  const elements: SlideElement[] = []

  // Watermark gigante (atrás de tudo)
  if (content.watermark) {
    elements.push(txt({
      kind: 'heading',
      x: 0, y: 200, w: CANVAS_W, h: 700,
      content: content.watermark,
      fontSize: scaled(t, 480),
      weight: 900,
      color: hexAlpha(t.palette.accent, 0.06),
      align: 'center',
      uppercase: true,
      letterSpacing: t.typography.headingTracking * 16,
      lineHeight: 1,
      delay: 0,
      animation: 'fade',
    }))
  }

  // Badge topo
  if (content.topBadge) {
    elements.push(badge({
      x: (CANVAS_W - 220) / 2, y: 200, w: 220, h: 44,
      text: content.topBadge,
      bg: 'transparent',
      color: t.palette.accent,
      fontSize: 13,
      delay: 100,
    }))
    // Borda do badge — usa um shape rect transparente com stroke
    elements.push(shape({
      kind: 'rect',
      x: (CANVAS_W - 220) / 2, y: 200, w: 220, h: 44,
      fill: 'transparent',
      borderRadius: 4,
      delay: 100,
    }))
  }

  // Nome da seção
  elements.push(txt({
    kind: 'heading',
    x: PADDING, y: 380, w: CANVAS_W - PADDING * 2, h: 200,
    content: content.sectionName,
    fontSize: scaled(t, 120),
    weight: 800,
    color: t.palette.text,
    align: 'center',
    uppercase: true,
    letterSpacing: t.typography.headingTracking * 16,
    lineHeight: 1.0,
    delay: 250,
    animation: 'slide-up',
  }))

  // Ícone central
  if (content.iconName) {
    elements.push(icon({
      x: (CANVAS_W - 96) / 2, y: 640, w: 96, h: 96,
      name: content.iconName,
      color: t.palette.accent,
      strokeWidth: 1.5,
      delay: 400,
    }))
  }

  // Tagline rodapé
  if (content.tagline) {
    elements.push(txt({
      kind: 'caption',
      x: PADDING, y: 800, w: CANVAS_W - PADDING * 2, h: 40,
      content: content.tagline,
      fontSize: 18, weight: 400,
      color: t.palette.textMuted,
      align: 'center',
      italic: true,
      delay: 550, animation: 'fade',
    }))
  }

  return {
    id: rid('slide-trans'),
    kind: 'custom',
    title: content.sectionName,
    background: { type: 'theme', color: 'dark' },
    elements,
    visible: true,
  }
}

// ============================================================================
//  Builder 5: FASES / DIAGRAMA
// ============================================================================

export interface FasesContent {
  heading: string
  /** Watermark de fundo */
  watermark?: string
  /** Ícone central representando o ciclo (ex: 'RefreshCw', 'Workflow') */
  centerIcon?: string
  /** Bullets de fases anteriores (esquerda) */
  pastPhases: string[]
  /** Bullets de fases futuras (direita) */
  futurePhases: string[]
  /** Label da fase atual em destaque */
  currentPhaseLabel?: string
}

export function buildFases(theme: Theme, content: FasesContent): Slide {
  const t = theme
  const elements: SlideElement[] = []

  // Watermark
  if (content.watermark) {
    elements.push(txt({
      kind: 'heading',
      x: 0, y: 740, w: CANVAS_W, h: 320,
      content: content.watermark,
      fontSize: scaled(t, 240),
      weight: 900,
      color: hexAlpha(t.palette.accent, 0.05),
      align: 'center',
      uppercase: true,
      letterSpacing: t.typography.headingTracking * 16,
      lineHeight: 1,
      delay: 0, animation: 'fade',
    }))
  }

  // Heading
  elements.push(txt({
    kind: 'heading',
    x: PADDING, y: 80, w: CANVAS_W - PADDING * 2, h: 100,
    content: content.heading,
    fontSize: scaled(t, 56),
    weight: 800,
    color: t.palette.accent,
    align: 'center',
    uppercase: true,
    letterSpacing: t.typography.headingTracking * 16,
    delay: 100, animation: 'slide-up',
  }))

  // Diagrama central — círculo com ícone
  const centerX = (CANVAS_W - 360) / 2
  const centerY = 280
  elements.push(shape({
    kind: 'circle',
    x: centerX, y: centerY, w: 360, h: 360,
    fill: hexAlpha(t.palette.accent, 0.08),
    delay: 200, animation: 'fade',
  }))
  elements.push(shape({
    kind: 'circle',
    x: centerX + 40, y: centerY + 40, w: 280, h: 280,
    fill: hexAlpha(t.palette.accent, 0.12),
    delay: 300, animation: 'fade',
  }))
  if (content.centerIcon) {
    elements.push(icon({
      x: centerX + 100, y: centerY + 100, w: 160, h: 160,
      name: content.centerIcon,
      color: t.palette.accent,
      strokeWidth: 1.2,
      delay: 400,
    }))
  }

  // Label de fase atual sob o diagrama
  if (content.currentPhaseLabel) {
    elements.push(txt({
      kind: 'caption',
      x: centerX, y: centerY + 380, w: 360, h: 32,
      content: content.currentPhaseLabel,
      fontSize: 14, weight: 700,
      color: t.palette.accent,
      align: 'center',
      uppercase: true,
      letterSpacing: t.typography.labelTracking * 14,
      delay: 500, animation: 'fade',
    }))
  }

  // Lista esquerda (passadas) — opacas
  const leftListX = PADDING
  const leftListY = 320
  content.pastPhases.slice(0, 4).forEach((text, i) => {
    elements.push(listItem({
      x: leftListX, y: leftListY + i * 90, w: 460, h: 70,
      bullet: 'check',
      text,
      bulletColor: hexAlpha(t.palette.accent, 0.6),
      textColor: hexAlpha(t.palette.text, 0.6),
      fontSize: 20,
      delay: 250 + i * 100,
    }))
  })

  // Lista direita (futuras)
  const rightListX = CANVAS_W - PADDING - 460
  const rightListY = 320
  content.futurePhases.slice(0, 4).forEach((text, i) => {
    elements.push(listItem({
      x: rightListX, y: rightListY + i * 90, w: 460, h: 70,
      bullet: 'arrow',
      text,
      bulletColor: t.palette.accent,
      textColor: t.palette.text,
      fontSize: 20,
      delay: 250 + i * 100,
    }))
  })

  return {
    id: rid('slide-fases'),
    kind: 'passos',
    title: 'Fases',
    background: { type: 'theme', color: 'dark' },
    elements,
    visible: true,
  }
}

// ============================================================================
//  Builder 6: FEATURES DUPLO (2 colunas)
// ============================================================================

export interface FeaturesDuploContent {
  /** Header geral opcional */
  smallLabel?: string
  heading?: string
  left: { title: string; subtitle?: string; description: string; imageSrc?: string | null; mockup?: 'dashboard' | 'portal' | 'whatsapp' | 'reports' | 'leads' | 'phone' }
  right: { title: string; subtitle?: string; description: string; imageSrc?: string | null; mockup?: 'dashboard' | 'portal' | 'whatsapp' | 'reports' | 'leads' | 'phone' }
}

export function buildFeaturesDuplo(theme: Theme, content: FeaturesDuploContent): Slide {
  const t = theme
  const elements: SlideElement[] = []

  // Heading geral
  if (content.smallLabel) {
    elements.push(txt({
      kind: 'caption',
      x: PADDING, y: 80, w: CANVAS_W - PADDING * 2, h: 28,
      content: content.smallLabel,
      fontSize: 14, weight: 700,
      color: t.palette.accent,
      align: 'center', uppercase: true,
      letterSpacing: t.typography.labelTracking * 14,
      delay: 100, animation: 'fade',
    }))
  }
  if (content.heading) {
    elements.push(txt({
      kind: 'heading',
      x: PADDING, y: 130, w: CANVAS_W - PADDING * 2, h: 80,
      content: content.heading,
      fontSize: scaled(t, 44),
      weight: 800,
      color: t.palette.text,
      align: 'center',
      uppercase: true,
      letterSpacing: t.typography.headingTracking * 16,
      delay: 200, animation: 'slide-up',
    }))
  }

  // Separador vertical sutil
  elements.push(shape({
    kind: 'rect',
    x: CANVAS_W / 2, y: 260, w: 1, h: 720,
    fill: hexAlpha(t.palette.text, 0.08),
    delay: 300,
  }))

  // ── Coluna esquerda ─────────────────────────────────────────────────────
  const colW = (CANVAS_W - PADDING * 2 - 80) / 2 // 80 = gutter
  const leftX = PADDING
  const rightX = leftX + colW + 80

  ;[
    { side: content.left, baseX: leftX, delay: 350 },
    { side: content.right, baseX: rightX, delay: 500 },
  ].forEach(({ side, baseX, delay }) => {
    // Subtitle pequeno
    if (side.subtitle) {
      elements.push(txt({
        kind: 'caption',
        x: baseX, y: 280, w: colW, h: 28,
        content: side.subtitle,
        fontSize: 13, weight: 700,
        color: t.palette.accent,
        uppercase: true,
        letterSpacing: t.typography.labelTracking * 13,
        delay, animation: 'fade',
      }))
    }
    // Title
    elements.push(txt({
      kind: 'subheading',
      x: baseX, y: 320, w: colW, h: 80,
      content: side.title,
      fontSize: scaled(t, 36), weight: 800,
      color: t.palette.text,
      uppercase: true,
      letterSpacing: t.typography.headingTracking * 16,
      delay: delay + 50, animation: 'slide-up',
    }))
    // Mockup ou Imagem
    if (side.mockup) {
      elements.push({
        id: rid('mock'),
        type: 'mockup',
        mockup: side.mockup,
        x: baseX, y: 430, w: colW, h: 460,
        accent: t.palette.accent,
        animation: { type: 'fade', delay: delay + 150, duration: 600 },
      } as SlideElement)
    } else {
      elements.push(img({
        x: baseX, y: 430, w: colW, h: 460,
        src: side.imageSrc ?? null,
        borderRadius: t.cards.radius,
        delay: delay + 150,
      }))
    }
    // Description
    elements.push(txt({
      kind: 'text',
      x: baseX, y: 920, w: colW, h: 80,
      content: side.description,
      fontSize: 17, weight: 400,
      color: t.palette.textMuted,
      lineHeight: 1.5,
      delay: delay + 250, animation: 'fade',
    }))
  })

  return {
    id: rid('slide-feat'),
    kind: 'sistema',
    title: 'Features',
    background: { type: 'theme', color: 'dark' },
    elements,
    visible: true,
  }
}

// ============================================================================
//  Builder 7: CARDS GRID (3x2)
// ============================================================================

export interface CardsGridContent {
  heading: string
  subheading?: string
  cards: Array<{
    icon?: string         // Lucide icon name
    name: string          // título do card
    detail: string        // descrição/valor
  }>
  closingLine?: string
}

export function buildCardsGrid(theme: Theme, content: CardsGridContent): Slide {
  const t = theme
  const elements: SlideElement[] = []

  // Heading
  elements.push(txt({
    kind: 'heading',
    x: PADDING, y: 80, w: CANVAS_W - PADDING * 2, h: 100,
    content: content.heading,
    fontSize: scaled(t, 56),
    weight: 800,
    color: t.palette.accent,
    align: 'center',
    uppercase: true,
    letterSpacing: t.typography.headingTracking * 16,
    delay: 100, animation: 'slide-up',
  }))

  if (content.subheading) {
    elements.push(txt({
      kind: 'subheading',
      x: PADDING, y: 200, w: CANVAS_W - PADDING * 2, h: 40,
      content: content.subheading,
      fontSize: 22, weight: 400,
      color: t.palette.textMuted,
      align: 'center',
      delay: 200, animation: 'fade',
    }))
  }

  // Grid 3x2 — 6 cards
  const cols = 3
  const rows = 2
  const gap = 30
  const gridW = CANVAS_W - PADDING * 2
  const cardW = (gridW - gap * (cols - 1)) / cols
  const cardH = 280
  const gridY = 320

  content.cards.slice(0, cols * rows).forEach((c, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const x = PADDING + col * (cardW + gap)
    const y = gridY + row * (cardH + gap)
    const delay = 300 + idx * 80

    // Card frame
    elements.push(card({
      x, y, w: cardW, h: cardH, theme: t, delay,
    }))
    // Ícone
    if (c.icon) {
      elements.push(icon({
        x: x + 32, y: y + 32, w: 56, h: 56,
        name: c.icon,
        color: t.palette.accent,
        strokeWidth: 1.5,
        delay: delay + 50,
      }))
    }
    // Name
    elements.push(txt({
      kind: 'subheading',
      x: x + 32, y: y + 110, w: cardW - 64, h: 60,
      content: c.name,
      fontSize: scaled(t, 26), weight: 700,
      color: t.palette.text,
      uppercase: true,
      letterSpacing: t.typography.headingTracking * 14,
      delay: delay + 100, animation: 'fade',
    }))
    // Detail
    elements.push(txt({
      kind: 'text',
      x: x + 32, y: y + 180, w: cardW - 64, h: 80,
      content: c.detail,
      fontSize: 15, weight: 400,
      color: t.palette.textMuted,
      lineHeight: 1.5,
      delay: delay + 150, animation: 'fade',
    }))
  })

  // Closing line
  if (content.closingLine) {
    elements.push(txt({
      kind: 'text',
      x: PADDING, y: gridY + rows * (cardH + gap) + 24, w: CANVAS_W - PADDING * 2, h: 40,
      content: content.closingLine,
      fontSize: 18, weight: 500,
      color: t.palette.text,
      align: 'center',
      italic: true,
      delay: 800, animation: 'fade',
    }))
  }

  return {
    id: rid('slide-grid'),
    kind: 'custom',
    title: 'Cards',
    background: { type: 'theme', color: 'dark' },
    elements,
    visible: true,
  }
}

// ============================================================================
//  Builder 8: PRICING (2 cards)
// ============================================================================

export interface PricingContent {
  heading: string
  subheading?: string
  plans: Array<{
    name: string
    items: string[]
    oldPrice?: string
    price: string
    priceLabel?: string
    ctaLabel?: string
    highlighted?: boolean
  }>
}

export function buildPricing(theme: Theme, content: PricingContent): Slide {
  const t = theme
  const elements: SlideElement[] = []

  // Heading
  elements.push(txt({
    kind: 'heading',
    x: PADDING, y: 80, w: CANVAS_W - PADDING * 2, h: 100,
    content: content.heading,
    fontSize: scaled(t, 56),
    weight: 800,
    color: t.palette.accent,
    align: 'center',
    uppercase: true,
    letterSpacing: t.typography.headingTracking * 16,
    delay: 100, animation: 'slide-up',
  }))

  if (content.subheading) {
    elements.push(txt({
      kind: 'subheading',
      x: PADDING, y: 200, w: CANVAS_W - PADDING * 2, h: 40,
      content: content.subheading,
      fontSize: 22, weight: 400,
      color: t.palette.textMuted,
      align: 'center',
      delay: 200, animation: 'fade',
    }))
  }

  // 2 cards lado a lado
  const cardW = 660
  const cardH = 720
  const gap = 60
  const totalW = cardW * 2 + gap
  const startX = (CANVAS_W - totalW) / 2
  const cardY = 280

  content.plans.slice(0, 2).forEach((p, idx) => {
    const x = startX + idx * (cardW + gap)
    const delay = 300 + idx * 200
    const isHighlighted = !!p.highlighted

    // Card
    elements.push(card({
      x, y: cardY, w: cardW, h: cardH,
      theme: t, delay,
    }))

    // Glow extra se highlighted
    if (isHighlighted) {
      elements.push(shape({
        kind: 'rect',
        x: x - 6, y: cardY - 6, w: cardW + 12, h: cardH + 12,
        fill: 'transparent',
        borderRadius: t.cards.radius + 4,
        delay,
      }))
    }

    // Plan name
    elements.push(txt({
      kind: 'heading',
      x: x + 40, y: cardY + 40, w: cardW - 80, h: 80,
      content: p.name,
      fontSize: scaled(t, 36), weight: 800,
      color: t.palette.accent,
      uppercase: true,
      letterSpacing: t.typography.headingTracking * 16,
      delay: delay + 100, animation: 'fade',
    }))

    // Linha separadora
    elements.push(shape({
      kind: 'rect',
      x: x + 40, y: cardY + 140, w: cardW - 80, h: 1,
      fill: hexAlpha(t.palette.accent, 0.3),
      delay: delay + 150,
    }))

    // Items
    p.items.slice(0, 6).forEach((item, i) => {
      elements.push(listItem({
        x: x + 40, y: cardY + 180 + i * 56, w: cardW - 80, h: 48,
        bullet: 'check',
        text: item,
        bulletColor: t.palette.accent,
        textColor: t.palette.text,
        fontSize: 18,
        delay: delay + 200 + i * 60,
      }))
    })

    // Preço (parte de baixo)
    const priceY = cardY + cardH - 200
    if (p.oldPrice) {
      elements.push(txt({
        kind: 'caption',
        x: x + 40, y: priceY, w: cardW - 80, h: 28,
        content: p.oldPrice,
        fontSize: 18, weight: 400,
        color: t.palette.textMuted,
        align: 'center',
        // strikethrough simulado via hifens (override stilístico tem que vir do CSS — aqui mantemos simples)
        delay: delay + 700, animation: 'fade',
      }))
    }
    elements.push(txt({
      kind: 'heading',
      x: x + 40, y: priceY + 32, w: cardW - 80, h: 80,
      content: p.price,
      fontSize: scaled(t, 56), weight: 800,
      color: t.palette.text,
      align: 'center',
      delay: delay + 750, animation: 'pop',
    }))
    if (p.priceLabel) {
      elements.push(txt({
        kind: 'caption',
        x: x + 40, y: priceY + 116, w: cardW - 80, h: 28,
        content: p.priceLabel,
        fontSize: 14, weight: 500,
        color: t.palette.textMuted,
        align: 'center',
        uppercase: true,
        letterSpacing: t.typography.labelTracking * 14,
        delay: delay + 800, animation: 'fade',
      }))
    }

    // CTA badge
    if (p.ctaLabel) {
      elements.push(badge({
        x: x + 40, y: cardY + cardH - 60, w: cardW - 80, h: 44,
        text: p.ctaLabel,
        bg: t.palette.accent,
        color: t.palette.bgOuter,
        fontSize: 13,
        delay: delay + 900,
      }))
    }
  })

  return {
    id: rid('slide-price'),
    kind: 'proposta',
    title: 'Pricing',
    background: { type: 'theme', color: 'dark' },
    elements,
    visible: true,
  }
}

// ============================================================================
//  Builder 9: PROCESSO HORIZONTAL (5 steps)
// ============================================================================

export interface ProcessoContent {
  /** Título opcional acima dos steps */
  heading?: string
  steps: Array<{ name: string; description: string }>  // até 5
  /** Texto pequeno de termos/observações no rodapé */
  fineprint?: string
}

export function buildProcessoHorizontal(theme: Theme, content: ProcessoContent): Slide {
  const t = theme
  const elements: SlideElement[] = []

  // Logo no topo (opcional via fieldKey)
  elements.push(logoCompany({
    x: (CANVAS_W - 200) / 2, y: 80, w: 200, h: 80,
    delay: 100,
  }))

  // Heading
  if (content.heading) {
    elements.push(txt({
      kind: 'heading',
      x: PADDING, y: 200, w: CANVAS_W - PADDING * 2, h: 80,
      content: content.heading,
      fontSize: scaled(t, 44),
      weight: 800,
      color: t.palette.accent,
      align: 'center',
      uppercase: true,
      letterSpacing: t.typography.headingTracking * 16,
      delay: 200, animation: 'slide-up',
    }))
  }

  // 5 steps em linha
  const stepCount = Math.min(content.steps.length, 5)
  const arrowW = 60
  const stepW = (CANVAS_W - PADDING * 2 - arrowW * (stepCount - 1)) / stepCount
  const stepH = 280
  const stepY = 400

  for (let i = 0; i < stepCount; i++) {
    const x = PADDING + i * (stepW + arrowW)
    const delay = 300 + i * 120
    const s = content.steps[i]

    // Card do step
    elements.push(card({
      x, y: stepY, w: stepW, h: stepH, theme: t, delay,
    }))

    // Número
    elements.push(txt({
      kind: 'caption',
      x: x + 24, y: stepY + 24, w: 60, h: 32,
      content: String(i + 1).padStart(2, '0'),
      fontSize: 16, weight: 800,
      color: t.palette.accent,
      letterSpacing: 0.05 * 16,
      delay: delay + 50,
    }))

    // Nome
    elements.push(txt({
      kind: 'subheading',
      x: x + 24, y: stepY + 80, w: stepW - 48, h: 70,
      content: s.name,
      fontSize: scaled(t, 22), weight: 700,
      color: t.palette.text,
      uppercase: true,
      letterSpacing: t.typography.headingTracking * 14,
      delay: delay + 100, animation: 'fade',
    }))

    // Descrição
    elements.push(txt({
      kind: 'text',
      x: x + 24, y: stepY + 160, w: stepW - 48, h: 100,
      content: s.description,
      fontSize: 13, weight: 400,
      color: t.palette.textMuted,
      lineHeight: 1.5,
      delay: delay + 150, animation: 'fade',
    }))

    // Seta entre steps
    if (i < stepCount - 1) {
      elements.push(icon({
        x: x + stepW + 16, y: stepY + stepH / 2 - 14, w: 28, h: 28,
        name: 'ChevronRight',
        color: t.palette.accent,
        strokeWidth: 2,
        delay: delay + 80,
      }))
    }
  }

  // Fineprint
  if (content.fineprint) {
    elements.push(txt({
      kind: 'caption',
      x: PADDING, y: CANVAS_H - 140, w: CANVAS_W - PADDING * 2, h: 60,
      content: content.fineprint,
      fontSize: 10, weight: 400,
      color: hexAlpha(t.palette.textMuted, 0.7),
      align: 'center',
      lineHeight: 1.5,
      delay: 1000, animation: 'fade',
    }))
  }

  return {
    id: rid('slide-proc'),
    kind: 'passos',
    title: 'Processo',
    background: { type: 'theme', color: 'dark' },
    elements,
    visible: true,
  }
}

// ============================================================================
//  Builder 10: PROPOSTA (2 painéis grandes)
// ============================================================================

export interface PropostaContent {
  heading: string
  subheading?: string
  panels: Array<{
    panelTitle: string
    items: string[]
    priceBadge: string
    priceCaption?: string
  }>
}

export function buildProposta(theme: Theme, content: PropostaContent): Slide {
  const t = theme
  const elements: SlideElement[] = []

  // Heading
  elements.push(txt({
    kind: 'heading',
    x: PADDING, y: 80, w: CANVAS_W - PADDING * 2, h: 100,
    content: content.heading,
    fontSize: scaled(t, 60),
    weight: 800,
    color: t.palette.accent,
    align: 'center',
    uppercase: true,
    letterSpacing: t.typography.headingTracking * 16,
    delay: 100, animation: 'slide-up',
  }))

  if (content.subheading) {
    elements.push(txt({
      kind: 'subheading',
      x: PADDING, y: 200, w: CANVAS_W - PADDING * 2, h: 40,
      content: content.subheading,
      fontSize: 22, weight: 400,
      color: t.palette.textMuted,
      align: 'center',
      delay: 200, animation: 'fade',
    }))
  }

  // 2 painéis grandes
  const panelW = 760
  const panelH = 720
  const gap = 60
  const totalW = panelW * 2 + gap
  const startX = (CANVAS_W - totalW) / 2
  const panelY = 280

  content.panels.slice(0, 2).forEach((p, idx) => {
    const x = startX + idx * (panelW + gap)
    const delay = 300 + idx * 200

    elements.push(card({
      x, y: panelY, w: panelW, h: panelH, theme: t, delay,
    }))

    // Título do painel
    elements.push(txt({
      kind: 'heading',
      x: x + 48, y: panelY + 48, w: panelW - 96, h: 70,
      content: p.panelTitle,
      fontSize: scaled(t, 32), weight: 800,
      color: t.palette.text,
      uppercase: true,
      letterSpacing: t.typography.headingTracking * 16,
      delay: delay + 100, animation: 'fade',
    }))

    // Linha separadora
    elements.push(shape({
      kind: 'rect',
      x: x + 48, y: panelY + 130, w: panelW - 96, h: 1,
      fill: hexAlpha(t.palette.accent, 0.4),
      delay: delay + 150,
    }))

    // Items (até 6)
    p.items.slice(0, 6).forEach((item, i) => {
      elements.push(listItem({
        x: x + 48, y: panelY + 170 + i * 64, w: panelW - 96, h: 56,
        bullet: 'check',
        text: item,
        bulletColor: t.palette.accent,
        textColor: t.palette.text,
        fontSize: 19,
        delay: delay + 200 + i * 70,
      }))
    })

    // Badge de preço
    elements.push(badge({
      x: x + 48, y: panelY + panelH - 100, w: panelW - 96, h: 60,
      text: p.priceBadge,
      bg: t.palette.accent,
      color: t.palette.bgOuter,
      fontSize: 22,
      uppercase: true,
      delay: delay + 800,
    }))
    if (p.priceCaption) {
      elements.push(txt({
        kind: 'caption',
        x: x + 48, y: panelY + panelH - 30, w: panelW - 96, h: 24,
        content: p.priceCaption,
        fontSize: 12, weight: 500,
        color: t.palette.textMuted,
        align: 'center',
        uppercase: true,
        letterSpacing: t.typography.labelTracking * 12,
        delay: delay + 850, animation: 'fade',
      }))
    }
  })

  return {
    id: rid('slide-prop'),
    kind: 'proposta',
    title: 'Proposta',
    background: { type: 'theme', color: 'dark' },
    elements,
    visible: true,
  }
}
