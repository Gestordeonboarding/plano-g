/**
 * Renderiza o padrão decorativo de fundo do theme atual SOBRE o gradiente
 * radial. Padrões disponíveis:
 *   - radial-only : nada (só o gradiente do SlideWrapper)
 *   - dots        : pontinhos sutis em grade
 *   - grid        : linhas finas formando grade
 *   - mesh        : mesh-gradient (3 cores) para vibe Aurora
 *   - noise       : grão de filme via SVG turbulence
 *   - lines       : linhas horizontais finas espaçadas
 *   - art-deco    : padrão geométrico (chevron/fan)
 *   - diagonals   : diagonais sutis (Crimson)
 *
 * Todos cobrem o canvas inteiro e ignoram pointer events.
 */

import { Theme, hexAlpha } from '@/lib/presentations/themes'

export default function BackgroundPattern({ theme }: { theme: Theme }) {
  const { pattern, patternColor, patternOpacity, grain } = theme.background

  // O grain é independente do pattern principal — pode ser stackado.
  const grainLayer = grain ? <NoisePattern color="#FFFFFF" opacity={0.03} /> : null

  let main: React.ReactNode = null

  switch (pattern) {
    case 'radial-only':
      main = null
      break
    case 'dots':
      main = <DotsPattern color={patternColor} opacity={patternOpacity} />
      break
    case 'grid':
      main = <GridPattern color={patternColor} opacity={patternOpacity} />
      break
    case 'mesh':
      main = <MeshPattern theme={theme} />
      break
    case 'noise':
      main = <NoisePattern color={patternColor} opacity={patternOpacity} />
      break
    case 'lines':
      main = <LinesPattern color={patternColor} opacity={patternOpacity} />
      break
    case 'art-deco':
      main = <ArtDecoPattern color={patternColor} opacity={patternOpacity} />
      break
    case 'diagonals':
      main = <DiagonalsPattern color={patternColor} opacity={patternOpacity} />
      break
  }

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {main}
      {grainLayer}
    </div>
  )
}

// ============================================================================
//  Padrões individuais
// ============================================================================

function DotsPattern({ color, opacity }: { color: string; opacity: number }) {
  return (
    <svg
      width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, opacity }}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="bg-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1.2" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg-dots)" />
    </svg>
  )
}

function GridPattern({ color, opacity }: { color: string; opacity: number }) {
  return (
    <svg
      width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, opacity }}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="bg-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke={color} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg-grid)" />
    </svg>
  )
}

function LinesPattern({ color, opacity }: { color: string; opacity: number }) {
  return (
    <svg
      width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, opacity }}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="bg-lines" x="0" y="0" width="100%" height="60" patternUnits="userSpaceOnUse">
          <line x1="0" y1="30" x2="100%" y2="30" stroke={color} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg-lines)" />
    </svg>
  )
}

function DiagonalsPattern({ color, opacity }: { color: string; opacity: number }) {
  return (
    <svg
      width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, opacity }}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id="bg-diagonals"
          x="0" y="0" width="60" height="60"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-15)"
        >
          <line x1="0" y1="0" x2="0" y2="60" stroke={color} strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg-diagonals)" />
    </svg>
  )
}

function ArtDecoPattern({ color, opacity }: { color: string; opacity: number }) {
  // Chevron/fan invertido — recurso clássico art-deco
  return (
    <svg
      width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, opacity }}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="bg-art-deco" x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M 0 60 L 60 0 L 120 60 M 60 0 L 60 60"
            fill="none"
            stroke={color}
            strokeWidth="0.6"
          />
          <circle cx="60" cy="30" r="1" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg-art-deco)" />
    </svg>
  )
}

function NoisePattern({ color, opacity }: { color: string; opacity: number }) {
  // Grão via feTurbulence — um clássico do Photoshop em SVG
  return (
    <svg
      width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay' }}
      preserveAspectRatio="none"
    >
      <filter id="bg-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#bg-noise)" opacity={0.5} />
    </svg>
  )
}

function MeshPattern({ theme }: { theme: Theme }) {
  // Mesh-gradient com 3 blobs de cores diferentes — vibe Aurora
  const { accent, secondary } = theme.palette
  return (
    <div
      className="absolute inset-0"
      style={{
        opacity: theme.background.patternOpacity,
        backgroundImage: [
          `radial-gradient(at 20% 30%, ${hexAlpha(accent, 0.6)} 0%, transparent 50%)`,
          `radial-gradient(at 80% 20%, ${hexAlpha(secondary, 0.5)} 0%, transparent 50%)`,
          `radial-gradient(at 60% 80%, ${hexAlpha(accent, 0.4)} 0%, transparent 60%)`,
        ].join(', '),
      }}
    />
  )
}
