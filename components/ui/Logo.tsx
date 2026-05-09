/**
 * Logo canônica do Plano G — apenas SVG, sem texto.
 * Usar tamanho via prop `size` (px). Padrão: 28.
 *
 * Regras:
 *  - Nunca acompanhar de texto "Plano G" no mesmo bloco visual
 *  - Gradiente sempre #0a3d35 → #00897b → #00c4b4
 *  - Seta sempre #00c4b4 puro (sem gradiente)
 *  - Fundo transparente — adapta ao container
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-label="Plano G"
      role="img"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#0a3d35" />
          <stop offset="45%"  stopColor="#00897b" />
          <stop offset="100%" stopColor="#00c4b4" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="38"  r="5.5" fill="url(#logo-grad)" />
      <circle cx="58"  cy="62"  r="5.5" fill="url(#logo-grad)" />
      <circle cx="142" cy="62"  r="5.5" fill="url(#logo-grad)" />
      <circle cx="48"  cy="110" r="5.5" fill="url(#logo-grad)" />
      <circle cx="100" cy="90"  r="5.5" fill="url(#logo-grad)" />
      <circle cx="140" cy="105" r="5.5" fill="url(#logo-grad)" />
      <circle cx="65"  cy="155" r="5.5" fill="url(#logo-grad)" />
      <circle cx="130" cy="155" r="5.5" fill="url(#logo-grad)" />
      <circle cx="100" cy="168" r="5.5" fill="url(#logo-grad)" />

      <g stroke="url(#logo-grad)" strokeWidth="2.2" strokeLinecap="round">
        <line x1="100" y1="38"  x2="58"  y2="62" />
        <line x1="100" y1="38"  x2="142" y2="62" />
        <line x1="58"  y1="62"  x2="48"  y2="110" />
        <line x1="48"  y1="110" x2="65"  y2="155" />
        <line x1="65"  y1="155" x2="100" y2="168" />
        <line x1="100" y1="168" x2="130" y2="155" />
        <line x1="130" y1="155" x2="140" y2="105" />
        <line x1="140" y1="105" x2="100" y2="90" />
        <line x1="100" y1="38"  x2="100" y2="90" />
        <line x1="58"  y1="62"  x2="100" y2="90" />
        <line x1="142" y1="62"  x2="100" y2="90" />
        <line x1="48"  y1="110" x2="100" y2="90" />
        <line x1="65"  y1="155" x2="100" y2="90" />
        <line x1="130" y1="155" x2="100" y2="90" />
        <line x1="58"  y1="62"  x2="130" y2="155" />
        <line x1="48"  y1="110" x2="130" y2="155" />
      </g>

      <g stroke="#00c4b4" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="100" y1="90" x2="152" y2="38" />
        <polyline points="138,34 152,38 148,52" />
      </g>
    </svg>
  )
}
