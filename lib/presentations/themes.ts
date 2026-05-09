/**
 * 8 Themes do módulo de apresentações (Dark Tech Premium DNA).
 *
 * Cada theme é uma "skin" completa que aplica sobre os 10 slide-layouts:
 *   - Paleta (background gradient, accent, secondary, surface, text, text-muted)
 *   - Tipografia (display + body + opcional mono para numerais)
 *   - Padrão de fundo (radial / dots / grid / mesh / noise / clean)
 *   - Tratamento dos cards (radius, espessura da borda, blur, notch)
 *   - Ornamento-assinatura (motivo decorativo único do tema)
 *
 * Todos os themes herdam o DNA Dark Tech Premium:
 *   - bg escuro com gradiente radial (não chapado)
 *   - cards com fundo levemente mais claro + borda fina no accent
 *   - títulos uppercase com letter-spacing 0.08-0.15em na cor accent
 *   - body cinza médio + destaques em branco puro
 *   - linha decorativa 80×2px no rodapé de cada slide
 */

import { FontFamily } from './types'

// ============================================================================
//  IDs dos themes
// ============================================================================

export type ThemeId =
  | 'teal-terminal'
  | 'onyx-gold'
  | 'cobalt-capital'
  | 'carbon-crimson'
  | 'forest-emerald'
  | 'aurora-violet'
  | 'bronze-heritage'
  | 'platinum-mono'

// ============================================================================
//  Estrutura de um theme
// ============================================================================

export interface ThemePalette {
  /** Cor inicial do gradiente radial (mais escura, vai pras bordas) */
  bgOuter: string
  /** Cor central do gradiente radial (mais clara, vai pro centro) */
  bgInner: string
  /** Accent principal — usado em títulos, bordas, ícones, linha decorativa */
  accent: string
  /** Accent secundário — usado em destaques de apoio */
  secondary: string
  /** Fundo dos cards (levemente mais claro que bgInner) */
  surface: string
  /** Texto principal sobre fundo escuro */
  text: string
  /** Texto auxiliar / body */
  textMuted: string
  /** Cor para "X" / negativo */
  negative: string
}

export interface ThemeTypography {
  /** Fonte de display (títulos grandes, headings) */
  display: FontFamily
  /** Fonte de body (parágrafos, listas, descrições) */
  body: FontFamily
  /** Fonte mono (opcional — usada em numerais/dados quando o tema pede) */
  mono?: FontFamily
  /** Tracking dos títulos uppercase (em em) */
  headingTracking: number
  /** Tracking dos labels uppercase (em em) */
  labelTracking: number
  /** Multiplicador de tamanho de display (1.0 = default) */
  displayScale: number
}

export type BgPatternKind =
  | 'radial-only'   // só o gradiente radial, sem overlay
  | 'dots'          // pontinhos sutis
  | 'grid'          // grade fina
  | 'mesh'          // mesh-gradient (3 cores blob)
  | 'noise'         // grão de filme
  | 'lines'         // linhas finas horizontais
  | 'art-deco'      // padrão geométrico art-deco
  | 'diagonals'     // linhas diagonais sutis

export interface ThemeBackground {
  /** Tipo de overlay decorativo sobre o gradiente radial */
  pattern: BgPatternKind
  /** Opacity do padrão (0-1) */
  patternOpacity: number
  /** Cor do padrão (geralmente o accent ou white com alpha) */
  patternColor: string
  /** Adicionar grão de ruído por cima de tudo (para Forest, Heritage) */
  grain: boolean
}

export interface ThemeCards {
  /** Border-radius dos cards principais */
  radius: number
  /** Espessura da borda dos cards (px) */
  borderWidth: number
  /** Borda usa o accent (true) ou hairline branca (false)? */
  borderUsesAccent: boolean
  /** Blur do bg dos cards (glassmorphism) — 0 = sem blur */
  backdropBlur: number
  /** Cards têm canto inferior cortado (notch tipo Crimson)? */
  cornerNotch: boolean
  /** Cards têm moldura dupla (Heritage)? */
  doubleBorder: boolean
}

export type OrnamentKind =
  | 'thin-line'       // linha 80×2 simples (default)
  | 'gold-filet'      // filete dourado fino com pontinhos
  | 'mono-bar'        // barra mono com label tipo terminal
  | 'cinetic-dash'    // traços cinéticos diagonais
  | 'botanic-leaf'    // ornamento botânico vertical
  | 'glow-halo'       // halo radial com glow
  | 'art-deco-corner' // cantos art-deco
  | 'mega-type'       // sem ornamento, tipografia gigante substitui

export interface ThemeOrnament {
  /** Motivo de assinatura no rodapé / cantos */
  kind: OrnamentKind
  /** Largura da linha decorativa do rodapé */
  footerLineWidth: number
  /** Altura da linha decorativa */
  footerLineHeight: number
  /** Mostrar marca-d'água com nome do theme em cantos? (decorativo) */
  showWatermark: boolean
}

export interface Theme {
  id: ThemeId
  name: string
  /** Descrição curta da personalidade — aparece no card de seleção */
  description: string
  /** Para qual perfil de cliente esse tema fala melhor */
  vibe: string
  palette: ThemePalette
  typography: ThemeTypography
  background: ThemeBackground
  cards: ThemeCards
  ornament: ThemeOrnament
}

// ============================================================================
//  Os 8 themes
// ============================================================================

export const THEMES: Record<ThemeId, Theme> = {
  // ────────────────────────────────────────────────────────────────────────
  // 1. TEAL TERMINAL — o original. Tech-forward / SaaS premium.
  // ────────────────────────────────────────────────────────────────────────
  'teal-terminal': {
    id: 'teal-terminal',
    name: 'Teal Terminal',
    description: 'Tech-forward, futurista. Verde-petróleo profundo com ciano vibrante.',
    vibe: 'SaaS premium, fintech, cliente que valoriza inovação',
    palette: {
      bgOuter: '#0A1A1A',
      bgInner: '#0D2B2B',
      accent: '#00D4B4',
      secondary: '#00A898',
      surface: '#111C1C',
      text: '#FFFFFF',
      textMuted: '#A8B8B8',
      negative: '#8B2020',
    },
    typography: {
      display: 'rajdhani',
      body: 'inter',
      headingTracking: 0.12,
      labelTracking: 0.25,
      displayScale: 1.0,
    },
    background: {
      pattern: 'dots',
      patternOpacity: 0.06,
      patternColor: '#00D4B4',
      grain: false,
    },
    cards: {
      radius: 8,
      borderWidth: 1,
      borderUsesAccent: true,
      backdropBlur: 0,
      cornerNotch: false,
      doubleBorder: false,
    },
    ornament: {
      kind: 'thin-line',
      footerLineWidth: 80,
      footerLineHeight: 2,
      showWatermark: false,
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // 2. ONYX & GOLD — private banking / imóvel alto padrão
  // ────────────────────────────────────────────────────────────────────────
  'onyx-gold': {
    id: 'onyx-gold',
    name: 'Onyx & Gold',
    description: 'Discreto e sofisticado. Preto onyx com filete dourado.',
    vibe: 'Private banking, imóvel alto padrão, cliente conservador-premium',
    palette: {
      bgOuter: '#080706',
      bgInner: '#1A1410',
      accent: '#C9A961',
      secondary: '#8C7A3F',
      surface: '#15110D',
      text: '#FFFFFF',
      textMuted: '#B8A88A',
      negative: '#7A2424',
    },
    typography: {
      display: 'cormorant',
      body: 'inter',
      headingTracking: 0.06,
      labelTracking: 0.30,
      displayScale: 1.15,
    },
    background: {
      pattern: 'noise',
      patternOpacity: 0.04,
      patternColor: '#C9A961',
      grain: true,
    },
    cards: {
      radius: 12,
      borderWidth: 1,
      borderUsesAccent: true,
      backdropBlur: 0,
      cornerNotch: false,
      doubleBorder: true,
    },
    ornament: {
      kind: 'gold-filet',
      footerLineWidth: 100,
      footerLineHeight: 1,
      showWatermark: false,
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // 3. COBALT CAPITAL — investidor / corporate / dashboard
  // ────────────────────────────────────────────────────────────────────────
  'cobalt-capital': {
    id: 'cobalt-capital',
    name: 'Cobalt Capital',
    description: 'Terminal de trading. Navy profundo com azul elétrico e tickers em mono.',
    vibe: 'Investidor, corporate, cliente analítico',
    palette: {
      bgOuter: '#0B1226',
      bgInner: '#0F1A35',
      accent: '#2563EB',
      secondary: '#60A5FA',
      surface: '#13203F',
      text: '#FFFFFF',
      textMuted: '#94A3B8',
      negative: '#7F1D1D',
    },
    typography: {
      display: 'inter-tight',
      body: 'inter',
      mono: 'jetbrains-mono',
      headingTracking: 0.04,
      labelTracking: 0.20,
      displayScale: 1.0,
    },
    background: {
      pattern: 'grid',
      patternOpacity: 0.08,
      patternColor: '#2563EB',
      grain: false,
    },
    cards: {
      radius: 2,
      borderWidth: 1.5,
      borderUsesAccent: true,
      backdropBlur: 0,
      cornerNotch: false,
      doubleBorder: false,
    },
    ornament: {
      kind: 'mono-bar',
      footerLineWidth: 120,
      footerLineHeight: 2,
      showWatermark: false,
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // 4. CARBON CRIMSON — auto premium / urgência comercial
  // ────────────────────────────────────────────────────────────────────────
  'carbon-crimson': {
    id: 'carbon-crimson',
    name: 'Carbon Crimson',
    description: 'Pista de corrida. Carbono puro com vermelho racing e diagonais cinéticas.',
    vibe: 'Auto premium, urgência comercial, cliente que decide rápido',
    palette: {
      bgOuter: '#050505',
      bgInner: '#1A0808',
      accent: '#DC2626',
      secondary: '#7F1D1D',
      surface: '#170A0A',
      text: '#FFFFFF',
      textMuted: '#A0A0A0',
      negative: '#DC2626',
    },
    typography: {
      display: 'bebas-neue',
      body: 'inter',
      headingTracking: 0.10,
      labelTracking: 0.25,
      displayScale: 1.25,
    },
    background: {
      pattern: 'diagonals',
      patternOpacity: 0.05,
      patternColor: '#DC2626',
      grain: true,
    },
    cards: {
      radius: 4,
      borderWidth: 2,
      borderUsesAccent: true,
      backdropBlur: 0,
      cornerNotch: true,
      doubleBorder: false,
    },
    ornament: {
      kind: 'cinetic-dash',
      footerLineWidth: 100,
      footerLineHeight: 3,
      showWatermark: true,
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // 5. FOREST EMERALD — imóvel estabelecido / família / herança
  // ────────────────────────────────────────────────────────────────────────
  'forest-emerald': {
    id: 'forest-emerald',
    name: 'Forest Emerald',
    description: 'Floresta serena. Verde escuro orgânico com esmeralda e ornamento botânico.',
    vibe: 'Imóvel estabelecido, família, cliente que valoriza tradição',
    palette: {
      bgOuter: '#0A1A0F',
      bgInner: '#0F2A1A',
      accent: '#10B981',
      secondary: '#047857',
      surface: '#13241B',
      text: '#FFFFFF',
      textMuted: '#A8C0B0',
      negative: '#7F1D1D',
    },
    typography: {
      display: 'playfair',
      body: 'inter',
      headingTracking: 0.04,
      labelTracking: 0.22,
      displayScale: 1.10,
    },
    background: {
      pattern: 'noise',
      patternOpacity: 0.05,
      patternColor: '#10B981',
      grain: true,
    },
    cards: {
      radius: 16,
      borderWidth: 1,
      borderUsesAccent: true,
      backdropBlur: 0,
      cornerNotch: false,
      doubleBorder: false,
    },
    ornament: {
      kind: 'botanic-leaf',
      footerLineWidth: 80,
      footerLineHeight: 2,
      showWatermark: false,
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // 6. AURORA VIOLET — tech jovem / lifestyle / startup
  // ────────────────────────────────────────────────────────────────────────
  'aurora-violet': {
    id: 'aurora-violet',
    name: 'Aurora Violet',
    description: 'Aurora boreal. Roxo profundo com violeta neon e mesh-gradient.',
    vibe: 'Tech jovem, lifestyle, startup, primeira compra',
    palette: {
      bgOuter: '#1A0E2E',
      bgInner: '#2D1B4E',
      accent: '#A855F7',
      secondary: '#EC4899',
      surface: '#241540',
      text: '#FFFFFF',
      textMuted: '#C4B5D9',
      negative: '#EC4899',
    },
    typography: {
      display: 'space-grotesk',
      body: 'inter',
      headingTracking: 0.02,
      labelTracking: 0.18,
      displayScale: 1.05,
    },
    background: {
      pattern: 'mesh',
      patternOpacity: 0.35,
      patternColor: '#A855F7',
      grain: false,
    },
    cards: {
      radius: 20,
      borderWidth: 1,
      borderUsesAccent: true,
      backdropBlur: 12,
      cornerNotch: false,
      doubleBorder: false,
    },
    ornament: {
      kind: 'glow-halo',
      footerLineWidth: 80,
      footerLineHeight: 2,
      showWatermark: false,
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // 7. BRONZE HERITAGE — tradicional / legacy
  // ────────────────────────────────────────────────────────────────────────
  'bronze-heritage': {
    id: 'bronze-heritage',
    name: 'Bronze Heritage',
    description: 'Sotão de família tradicional. Marrom profundo com bronze e ornamento art-deco.',
    vibe: 'Tradicional, legacy, "60 anos de história", cliente conservador',
    palette: {
      bgOuter: '#1C1410',
      bgInner: '#2A1F18',
      accent: '#CD7F32',
      secondary: '#8B5A2B',
      surface: '#1F1813',
      text: '#FFFFFF',
      textMuted: '#C0AB95',
      negative: '#7A2424',
    },
    typography: {
      display: 'libre-baskerville',
      body: 'inter',
      headingTracking: 0.05,
      labelTracking: 0.28,
      displayScale: 1.05,
    },
    background: {
      pattern: 'art-deco',
      patternOpacity: 0.05,
      patternColor: '#CD7F32',
      grain: true,
    },
    cards: {
      radius: 6,
      borderWidth: 1,
      borderUsesAccent: true,
      backdropBlur: 0,
      cornerNotch: false,
      doubleBorder: true,
    },
    ornament: {
      kind: 'art-deco-corner',
      footerLineWidth: 120,
      footerLineHeight: 1,
      showWatermark: false,
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // 8. PLATINUM MONO — editorial minimalista
  // ────────────────────────────────────────────────────────────────────────
  'platinum-mono': {
    id: 'platinum-mono',
    name: 'Platinum Mono',
    description: 'Editorial minimalista. Preto puro com platina, sem cor, tipografia gigante.',
    vibe: '"Design sabe", minimalista premium, cliente sofisticado',
    palette: {
      bgOuter: '#000000',
      bgInner: '#0A0A0A',
      accent: '#E5E7EB',
      secondary: '#9CA3AF',
      surface: '#0F0F0F',
      text: '#FFFFFF',
      textMuted: '#71717A',
      negative: '#525252',
    },
    typography: {
      display: 'inter-tight',
      body: 'inter',
      headingTracking: -0.02,
      labelTracking: 0.35,
      displayScale: 1.30,
    },
    background: {
      pattern: 'radial-only',
      patternOpacity: 0,
      patternColor: '#E5E7EB',
      grain: false,
    },
    cards: {
      radius: 0,
      borderWidth: 0.5,
      borderUsesAccent: false,
      backdropBlur: 0,
      cornerNotch: false,
      doubleBorder: false,
    },
    ornament: {
      kind: 'mega-type',
      footerLineWidth: 200,
      footerLineHeight: 1,
      showWatermark: false,
    },
  },
}

// ============================================================================
//  Helpers
// ============================================================================

export const DEFAULT_THEME_ID: ThemeId = 'teal-terminal'

export function getTheme(id: ThemeId | string | null | undefined): Theme {
  if (!id) return THEMES[DEFAULT_THEME_ID]
  return THEMES[id as ThemeId] ?? THEMES[DEFAULT_THEME_ID]
}

export const THEME_LIST: Theme[] = Object.values(THEMES)

/** Helper: aplica alpha em hex (#RRGGBB → rgba) */
export function hexAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** CSS do gradiente radial padrão de um theme */
export function themeBackgroundCss(theme: Theme): string {
  return `radial-gradient(ellipse at center, ${theme.palette.bgInner} 0%, ${theme.palette.bgOuter} 100%)`
}
