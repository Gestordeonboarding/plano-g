/**
 * Resolução de cores semânticas → hex em runtime, baseado na paleta da
 * administradora atualmente selecionada.
 */

import { ColorValue, ColorToken, PresentationCustomization } from './types'
import { getPalette } from './admin-colors'

const SURFACE_TOKENS: Record<string, string> = {
  surface:    'rgba(255,255,255,0.06)',
  'surface-2':'rgba(255,255,255,0.10)',
  text:       '#FFFFFF',
  'text-muted':'rgba(255,255,255,0.65)',
  white:      '#FFFFFF',
  black:      '#0B0B0B',
  transparent:'transparent',
}

export function resolveColor(value: ColorValue, c: PresentationCustomization): string {
  // Não é token semântico → retorna direto
  if (typeof value === 'string' && value.startsWith('#')) return value
  if (typeof value === 'string' && (value.startsWith('rgb') || value === 'transparent')) return value

  const token = value as ColorToken
  const palette = getPalette(c.admin_id)

  switch (token) {
    case 'primary':    return c.primary_override   || palette.primary
    case 'secondary':  return c.secondary_override || palette.secondary
    case 'dark':       return c.dark_override      || palette.dark
    case 'on-primary': return palette.text_on_primary
    default:           return SURFACE_TOKENS[token] || '#FFFFFF'
  }
}

/** Versão com alpha (rgba) para cores tokenizadas */
export function resolveColorAlpha(value: ColorValue, alpha: number, c: PresentationCustomization): string {
  const hex = resolveColor(value, c)
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex
  if (hex === 'transparent') return hex
  // converte #RRGGBB → rgba
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Calcula contraste e devolve preto ou branco para texto */
export function pickContrastText(hex: string): string {
  if (!hex.startsWith('#')) return '#FFFFFF'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#0B0B0B' : '#FFFFFF'
}

/**
 * FONT_STACK — pareado com os CSS variables definidos em app/layout.tsx via
 * next/font/google. Cada font-family tem fallback explícito porque as fontes
 * são carregadas com display: swap.
 */
export const FONT_STACK: Record<string, string> = {
  inter:               "var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
  'inter-tight':       "var(--font-inter-tight), 'Inter Tight', 'Inter', system-ui, sans-serif",
  playfair:            "var(--font-playfair), 'Playfair Display', Georgia, serif",
  montserrat:          "var(--font-montserrat), 'Montserrat', sans-serif",
  poppins:             "var(--font-poppins), 'Poppins', sans-serif",
  rajdhani:            "var(--font-rajdhani), 'Rajdhani', 'Inter', sans-serif",
  cormorant:           "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
  'jetbrains-mono':    "var(--font-jetbrains-mono), 'JetBrains Mono', 'Courier New', monospace",
  'bebas-neue':        "var(--font-bebas-neue), 'Bebas Neue', 'Impact', sans-serif",
  'space-grotesk':     "var(--font-space-grotesk), 'Space Grotesk', 'Inter', sans-serif",
  'libre-baskerville': "var(--font-libre-baskerville), 'Libre Baskerville', Georgia, serif",
}
