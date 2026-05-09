/**
 * Ornamento-assinatura do rodapé. Cada theme tem seu motivo único:
 *   - thin-line       : linha horizontal simples (Teal Terminal)
 *   - gold-filet      : filete fino com pontinhos centrais (Onyx & Gold)
 *   - mono-bar        : barra com label tipo terminal (Cobalt Capital)
 *   - cinetic-dash    : traços cinéticos (Carbon Crimson)
 *   - botanic-leaf    : ornamento botânico vertical (Forest Emerald)
 *   - glow-halo       : halo radial com glow (Aurora Violet)
 *   - art-deco-corner : cantos art-deco (Bronze Heritage)
 *   - mega-type       : sem ornamento, tipografia gigante substitui (Platinum Mono)
 */

import { Theme, hexAlpha } from '@/lib/presentations/themes'

interface OrnamentProps {
  theme: Theme
  /** Posição vertical do ornamento (px no canvas 1920×1080) */
  bottom?: number
}

export default function Ornament({ theme, bottom = 60 }: OrnamentProps) {
  const { ornament, palette } = theme
  const accent = palette.accent
  const w = ornament.footerLineWidth
  const h = ornament.footerLineHeight

  // ── thin-line ─────────────────────────────────────────────────────────
  if (ornament.kind === 'thin-line') {
    return (
      <div
        className="absolute"
        style={{
          left: '50%',
          bottom,
          width: w,
          height: h,
          backgroundColor: accent,
          transform: 'translateX(-50%)',
        }}
      />
    )
  }

  // ── gold-filet ────────────────────────────────────────────────────────
  if (ornament.kind === 'gold-filet') {
    return (
      <div
        className="absolute flex items-center"
        style={{
          left: '50%',
          bottom,
          transform: 'translateX(-50%)',
          gap: 12,
        }}
      >
        <div style={{ width: w, height: h, backgroundColor: accent }} />
        <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: accent }} />
        <div style={{ width: w, height: h, backgroundColor: accent }} />
      </div>
    )
  }

  // ── mono-bar ──────────────────────────────────────────────────────────
  if (ornament.kind === 'mono-bar') {
    return (
      <div
        className="absolute flex items-center"
        style={{
          left: '50%',
          bottom,
          transform: 'translateX(-50%)',
          gap: 16,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 12,
          letterSpacing: '0.2em',
          color: accent,
          textTransform: 'uppercase',
        }}
      >
        <div style={{ width: w / 2, height: h, backgroundColor: accent }} />
        <span>// PLANO G</span>
        <div style={{ width: w / 2, height: h, backgroundColor: accent }} />
      </div>
    )
  }

  // ── cinetic-dash ──────────────────────────────────────────────────────
  if (ornament.kind === 'cinetic-dash') {
    return (
      <div
        className="absolute flex items-center"
        style={{
          left: '50%',
          bottom,
          transform: 'translateX(-50%) skewX(-20deg)',
          gap: 8,
        }}
      >
        <div style={{ width: 28, height: h, backgroundColor: accent }} />
        <div style={{ width: 14, height: h, backgroundColor: accent }} />
        <div style={{ width: 6, height: h, backgroundColor: accent }} />
      </div>
    )
  }

  // ── botanic-leaf ──────────────────────────────────────────────────────
  if (ornament.kind === 'botanic-leaf') {
    return (
      <div
        className="absolute flex items-center"
        style={{
          left: '50%',
          bottom,
          transform: 'translateX(-50%)',
          gap: 16,
        }}
      >
        <div style={{ width: w / 2, height: 1, backgroundColor: accent }} />
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2 C 6 6, 4 10, 10 18 C 16 10, 14 6, 10 2 Z"
            stroke={accent}
            strokeWidth="1"
            fill="none"
          />
          <line x1="10" y1="2" x2="10" y2="18" stroke={accent} strokeWidth="0.5" />
        </svg>
        <div style={{ width: w / 2, height: 1, backgroundColor: accent }} />
      </div>
    )
  }

  // ── glow-halo ─────────────────────────────────────────────────────────
  if (ornament.kind === 'glow-halo') {
    return (
      <div
        className="absolute"
        style={{
          left: '50%',
          bottom: bottom - 20,
          transform: 'translateX(-50%)',
          width: 200,
          height: 40,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, ${hexAlpha(accent, 0.5)} 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 19,
            width: w,
            height: h,
            backgroundColor: accent,
            transform: 'translateX(-50%)',
            boxShadow: `0 0 20px ${accent}`,
          }}
        />
      </div>
    )
  }

  // ── art-deco-corner ───────────────────────────────────────────────────
  if (ornament.kind === 'art-deco-corner') {
    return (
      <div
        className="absolute flex items-center"
        style={{
          left: '50%',
          bottom,
          transform: 'translateX(-50%)',
          gap: 12,
        }}
      >
        <div style={{ width: w / 3, height: h, backgroundColor: accent }} />
        <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
          <path
            d="M 0 7 L 6 0 L 12 7 L 18 0 L 24 7"
            stroke={accent}
            strokeWidth="1"
            fill="none"
          />
        </svg>
        <div style={{ width: w / 3, height: h, backgroundColor: accent }} />
      </div>
    )
  }

  // ── mega-type ─────────────────────────────────────────────────────────
  // Sem ornamento — Platinum Mono confia na tipografia gigante.
  if (ornament.kind === 'mega-type') {
    return null
  }

  return null
}
