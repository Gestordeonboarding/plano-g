'use client'

import { useEffect, useState } from 'react'

function pt(angleDeg: number, r: number, cx = 200, cy = 200) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function rectPts(cx: number, cy: number, angleDeg: number, len: number, wid: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  const cos = Math.cos(rad), sin = Math.sin(rad)
  return [
    [cx + cos * len / 2 - sin * wid / 2, cy + sin * len / 2 + cos * wid / 2],
    [cx + cos * len / 2 + sin * wid / 2, cy + sin * len / 2 - cos * wid / 2],
    [cx - cos * len / 2 + sin * wid / 2, cy - sin * len / 2 - cos * wid / 2],
    [cx - cos * len / 2 - sin * wid / 2, cy - sin * len / 2 + cos * wid / 2],
  ].map(p => p.join(',')).join(' ')
}

const SCREWS: [number, number][] = [
  [200, 32],  [308, 92],  [368, 200], [308, 308],
  [200, 368], [92, 308],  [32, 200],  [92, 92],
]

export default function RoyalOakClock({ size = 260 }: { size?: number }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 50)
    return () => clearInterval(id)
  }, [])

  const h = now.getHours() % 12
  const m = now.getMinutes()
  const s = now.getSeconds()
  const ms = now.getMilliseconds()
  const secDeg    = s * 6 + ms * 0.006
  const minDeg    = m * 6 + s * 0.1
  const hrDeg     = h * 30 + m * 0.5
  const balanceDeg = Math.sin(now.getTime() * 0.018) * 155

  return (
    <svg viewBox="0 0 400 400" width={size} height={size} style={{ display: 'block' }}>
      <defs>
        {/* ── Steel gradients ── */}
        <linearGradient id="ap_steelMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#EAEAEE"/>
          <stop offset="22%"  stopColor="#C2C2CA"/>
          <stop offset="50%"  stopColor="#909098"/>
          <stop offset="78%"  stopColor="#BABAC2"/>
          <stop offset="100%" stopColor="#787880"/>
        </linearGradient>
        <linearGradient id="ap_steelFlat" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#D6D6DA"/>
          <stop offset="35%"  stopColor="#AEAEB6"/>
          <stop offset="65%"  stopColor="#969698"/>
          <stop offset="100%" stopColor="#AEAEB4"/>
        </linearGradient>
        <linearGradient id="ap_steelDiag" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#A8A8B0"/>
          <stop offset="28%"  stopColor="#F2F2F6"/>
          <stop offset="72%"  stopColor="#F2F2F6"/>
          <stop offset="100%" stopColor="#A0A0A8"/>
        </linearGradient>
        <linearGradient id="ap_bezelRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#D0D0D8"/>
          <stop offset="50%"  stopColor="#686870"/>
          <stop offset="100%" stopColor="#C8C8D0"/>
        </linearGradient>
        <radialGradient id="ap_screw" cx="30%" cy="25%" r="72%">
          <stop offset="0%"   stopColor="#F4F4F8"/>
          <stop offset="42%"  stopColor="#B2B2BA"/>
          <stop offset="100%" stopColor="#565660"/>
        </radialGradient>
        <linearGradient id="ap_hand" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#646470"/>
          <stop offset="34%"  stopColor="#E6E6EA"/>
          <stop offset="66%"  stopColor="#E6E6EA"/>
          <stop offset="100%" stopColor="#646470"/>
        </linearGradient>
        <linearGradient id="ap_lume" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#CCE8DC"/>
          <stop offset="100%" stopColor="#86C0A8"/>
        </linearGradient>

        {/* ── Blue Grande Tapisserie ── */}
        <pattern id="ap_tap" x="0" y="0" width="9" height="9" patternUnits="userSpaceOnUse">
          <rect width="9" height="9" fill="#142538"/>
          <rect x="0.6" y="0.6" width="7.8" height="7.8" fill="#1C3D64"/>
          <polygon points="0.6,0.6 8.4,0.6 7,2 2,2" fill="#2A5888" opacity="0.75"/>
          <polygon points="0.6,0.6 2,2 2,7 0.6,8.4" fill="#2A5888" opacity="0.75"/>
          <rect x="2" y="2" width="5" height="5" fill="#224C7C"/>
          <polygon points="0.6,8.4 8.4,8.4 7,7 2,7" fill="#0C1E30" opacity="0.55"/>
          <polygon points="8.4,0.6 8.4,8.4 7,7 7,2" fill="#0C1E30" opacity="0.55"/>
        </pattern>
        <radialGradient id="ap_dialSheen" cx="37%" cy="30%" r="76%">
          <stop offset="0%"   stopColor="#4080C0" stopOpacity="0.45"/>
          <stop offset="40%"  stopColor="#183A60" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#020810" stopOpacity="0.88"/>
        </radialGradient>

        {/* ── Tourbillon ── */}
        <radialGradient id="ap_tourbMetal" cx="35%" cy="28%" r="70%">
          <stop offset="0%"   stopColor="#CCD4DC"/>
          <stop offset="100%" stopColor="#545860"/>
        </radialGradient>
        <radialGradient id="ap_ruby" cx="30%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="#FF9090"/>
          <stop offset="55%"  stopColor="#CC2020"/>
          <stop offset="100%" stopColor="#780000"/>
        </radialGradient>

        {/* ── Filters ── */}
        <filter id="ap_outerShadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="18" floodColor="#000" floodOpacity="0.94"/>
        </filter>
        <filter id="ap_handShadow" x="-100%" y="-100%" width="300%" height="300%">
          <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.65"/>
        </filter>
        <filter id="ap_markerGlow">
          <feGaussianBlur stdDeviation="0.7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ap_crystalGlare" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* ── Clips ── */}
        <clipPath id="ap_dialClip">
          <circle cx="200" cy="200" r="150"/>
        </clipPath>
      </defs>

      {/* ══ BRACELET LINKS ══ */}
      <g>
        <rect x="158" y="0" width="84" height="22" rx="3" fill="url(#ap_steelFlat)" stroke="#686870" strokeWidth="0.5"/>
        <line x1="183" y1="0" x2="183" y2="22" stroke="#808088" strokeWidth="0.8"/>
        <line x1="217" y1="0" x2="217" y2="22" stroke="#808088" strokeWidth="0.8"/>
        <line x1="172" y1="0" x2="172" y2="22" stroke="#888890" strokeWidth="0.4"/>
        <line x1="228" y1="0" x2="228" y2="22" stroke="#888890" strokeWidth="0.4"/>
        <rect x="183" y="3" width="34" height="16" rx="2" fill="#C8C8D0" opacity="0.2"/>
      </g>
      <g>
        <rect x="158" y="378" width="84" height="22" rx="3" fill="url(#ap_steelFlat)" stroke="#686870" strokeWidth="0.5"/>
        <line x1="183" y1="378" x2="183" y2="400" stroke="#808088" strokeWidth="0.8"/>
        <line x1="217" y1="378" x2="217" y2="400" stroke="#808088" strokeWidth="0.8"/>
        <line x1="172" y1="378" x2="172" y2="400" stroke="#888890" strokeWidth="0.4"/>
        <line x1="228" y1="378" x2="228" y2="400" stroke="#888890" strokeWidth="0.4"/>
        <rect x="183" y="379" width="34" height="16" rx="2" fill="#C8C8D0" opacity="0.2"/>
      </g>

      {/* ══ OUTER SHADOW ══ */}
      <polygon points="150,20 250,20 380,150 380,250 250,380 150,380 20,250 20,150"
        fill="#181820" filter="url(#ap_outerShadow)"/>

      {/* ══ BEZEL BASE ══ */}
      <polygon points="150,20 250,20 380,150 380,250 250,380 150,380 20,250 20,150"
        fill="url(#ap_steelMain)"/>

      {/* Brushed flat faces */}
      <polygon points="150,20 250,20 236,45 164,45"    fill="url(#ap_steelFlat)"/>
      <polygon points="150,380 250,380 236,355 164,355" fill="url(#ap_steelFlat)"/>
      <polygon points="20,150 20,250 45,236 45,164"    fill="url(#ap_steelFlat)"/>
      <polygon points="380,150 380,250 355,236 355,164" fill="url(#ap_steelFlat)"/>

      {/* Polished chamfered faces */}
      <polygon points="250,20 380,150 357,157 240,44"  fill="url(#ap_steelDiag)" opacity="0.82"/>
      <polygon points="380,250 250,380 240,356 357,243" fill="url(#ap_steelDiag)" opacity="0.82"/>
      <polygon points="150,380 20,250 43,243 160,356"  fill="url(#ap_steelDiag)" opacity="0.82"/>
      <polygon points="20,150 150,20 160,44 43,157"    fill="url(#ap_steelDiag)" opacity="0.82"/>

      {/* Outer edge */}
      <polygon points="150,20 250,20 380,150 380,250 250,380 150,380 20,250 20,150"
        fill="none" stroke="#E8E8EC" strokeWidth="1.8" opacity="0.55"/>
      <polygon points="150,20 250,20 380,150 380,250 250,380 150,380 20,250 20,150"
        fill="none" stroke="#303038" strokeWidth="0.6" opacity="0.6"/>

      {/* Brushed texture lines — top flat */}
      {Array.from({ length: 15 }, (_, i) => (
        <line key={i} x1={165 + i * 5.4} y1={21} x2={164 + i * 5.4} y2={44}
          stroke="#B8B8C0" strokeWidth="0.25" opacity="0.45"/>
      ))}
      {/* Brushed texture lines — bottom flat */}
      {Array.from({ length: 15 }, (_, i) => (
        <line key={i} x1={165 + i * 5.4} y1={379} x2={164 + i * 5.4} y2={356}
          stroke="#B8B8C0" strokeWidth="0.25" opacity="0.45"/>
      ))}

      {/* ══ 8 SCREWS ══ */}
      {SCREWS.map(([sx, sy], i) => (
        <g key={i}>
          <circle cx={sx} cy={sy} r="14.5" fill="#1C2028"/>
          <circle cx={sx} cy={sy} r="13"   fill="url(#ap_screw)"/>
          <circle cx={sx} cy={sy} r="13"   fill="none" stroke="#343440" strokeWidth="1.2"/>
          {/* Knurl ring */}
          {Array.from({ length: 20 }, (_, j) => {
            const a = j * 18 * Math.PI / 180
            return <line key={j}
              x1={sx + 10.5 * Math.cos(a)} y1={sy + 10.5 * Math.sin(a)}
              x2={sx + 12.5 * Math.cos(a)} y2={sy + 12.5 * Math.sin(a)}
              stroke="#242430" strokeWidth="0.9"/>
          })}
          {/* Hex slot */}
          {[0, 60, 120].map(a => {
            const r = 7.5
            return <line key={a}
              x1={sx + r * Math.cos(a * Math.PI / 180)} y1={sy + r * Math.sin(a * Math.PI / 180)}
              x2={sx - r * Math.cos(a * Math.PI / 180)} y2={sy - r * Math.sin(a * Math.PI / 180)}
              stroke="#242430" strokeWidth="2.6" strokeLinecap="round"/>
          })}
          <ellipse cx={sx - 3.5} cy={sy - 4} rx="4.5" ry="3" fill="#F2F2F6" opacity="0.42"/>
        </g>
      ))}

      {/* ══ CRYSTAL RING ══ */}
      <circle cx="200" cy="200" r="162" fill="#0E1620" stroke="#080E18" strokeWidth="2"/>
      <circle cx="200" cy="200" r="157" fill="url(#ap_bezelRim)" fillOpacity="0" stroke="url(#ap_bezelRim)" strokeWidth="4"/>
      <circle cx="200" cy="200" r="154" fill="#07101A"/>
      <circle cx="200" cy="200" r="151" fill="none" stroke="#1A2A3A" strokeWidth="1.5"/>

      {/* ══ DIAL ══ */}
      <circle cx="200" cy="200" r="150" fill="url(#ap_tap)"/>
      <circle cx="200" cy="200" r="150" fill="url(#ap_dialSheen)"/>

      {/* Chapter ring */}
      <circle cx="200" cy="200" r="149" fill="none" stroke="#9ABCD8" strokeWidth="0.8" opacity="0.3"/>
      <circle cx="200" cy="200" r="143" fill="none" stroke="#4E7898" strokeWidth="0.4" opacity="0.2"/>

      {/* ══ MINUTE TICKS ══ */}
      {Array.from({ length: 60 }, (_, i) => {
        const isH = i % 5 === 0
        const p1 = pt(i * 6, 142)
        const p2 = pt(i * 6, isH ? 131 : 137)
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke={isH ? '#B8D4F0' : '#506070'}
          strokeWidth={isH ? 2.2 : 1}
          opacity={isH ? 0.9 : 0.45}/>
      })}

      {/* ══ APPLIED HOUR MARKERS ══ */}
      {Array.from({ length: 12 }, (_, i) => {
        if (i === 6) return null
        const ang = i * 30
        const c = pt(ang, 120)

        if (i === 0) {
          const rad = (ang - 90) * Math.PI / 180
          const px = Math.cos(rad + Math.PI / 2)
          const py = Math.sin(rad + Math.PI / 2)
          const off = 4.5
          return (
            <g key={i} filter="url(#ap_markerGlow)">
              <polygon points={rectPts(c.x - px*off, c.y - py*off, ang, 22, 4.5)} fill="url(#ap_hand)"/>
              <polygon points={rectPts(c.x - px*off, c.y - py*off, ang, 17, 2.5)} fill="url(#ap_lume)" opacity="0.85"/>
              <polygon points={rectPts(c.x + px*off, c.y + py*off, ang, 22, 4.5)} fill="url(#ap_hand)"/>
              <polygon points={rectPts(c.x + px*off, c.y + py*off, ang, 17, 2.5)} fill="url(#ap_lume)" opacity="0.85"/>
            </g>
          )
        }
        return (
          <g key={i} filter="url(#ap_markerGlow)">
            <polygon points={rectPts(c.x, c.y, ang, 22, 5)} fill="url(#ap_hand)"/>
            <polygon points={rectPts(c.x, c.y, ang, 16, 2.8)} fill="url(#ap_lume)" opacity="0.85"/>
          </g>
        )
      })}

      {/* ══ BRAND TEXT ══ */}
      <text x="200" y="153" textAnchor="middle" fill="#C8E0F4"
        fontSize="10" fontFamily="Georgia,'Times New Roman',serif" letterSpacing="2.5" opacity="0.88">
        AUDEMARS PIGUET
      </text>

      {/* ══ TOURBILLON at 6 o'clock ══ */}
      <circle cx="200" cy="292" r="33" fill="#060C14" stroke="#3060A0" strokeWidth="0.8" opacity="0.6"/>
      <circle cx="200" cy="292" r="30" fill="#04080E"/>

      {/* Fixed frame: top + bottom bridges */}
      <rect x="184" y="262" width="32" height="6.5" rx="3" fill="url(#ap_tourbMetal)"/>
      <rect x="188" y="263.5" width="24" height="3.5" rx="1.5" fill="#D0D8E4" opacity="0.55"/>
      <rect x="184" y="323" width="32" height="6.5" rx="3" fill="url(#ap_tourbMetal)"/>
      <rect x="188" y="324.5" width="24" height="3.5" rx="1.5" fill="#D0D8E4" opacity="0.55"/>

      {/* Fixed frame: side pillars */}
      <rect x="169" y="266" width="7" height="56" rx="3" fill="url(#ap_tourbMetal)" opacity="0.75"/>
      <rect x="224" y="266" width="7" height="56" rx="3" fill="url(#ap_tourbMetal)" opacity="0.75"/>

      {/* ── Rotating cage ── */}
      <g transform={`rotate(${secDeg} 200 292)`}>
        {/* Cage outer ring */}
        <circle cx="200" cy="292" r="24" fill="none" stroke="#C0D0E0" strokeWidth="2.2"/>
        {/* Cage top plate */}
        <circle cx="200" cy="292" r="20" fill="#0C1824" opacity="0.85"/>

        {/* Main cage spokes */}
        <line x1="200" y1="268" x2="200" y2="316" stroke="#B0C2D4" strokeWidth="1.8"/>
        <line x1="176" y1="292" x2="224" y2="292" stroke="#B0C2D4" strokeWidth="1.8"/>
        <line x1="183" y1="275" x2="217" y2="309" stroke="#8AAABA" strokeWidth="1.1"/>
        <line x1="217" y1="275" x2="183" y2="309" stroke="#8AAABA" strokeWidth="1.1"/>

        {/* Escapement wheel */}
        {Array.from({ length: 18 }, (_, j) => {
          const a = j * 20
          const p1 = pt(a, 9,  200, 292)
          const p2 = pt(a, 13, 200, 292)
          return <line key={j} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke="#C8D8E8" strokeWidth="2" strokeLinecap="round"/>
        })}
        <circle cx="200" cy="292" r="9" fill="none" stroke="#8098B4" strokeWidth="0.8"/>

        {/* ── Balance wheel (oscillates) ── */}
        <g transform={`rotate(${balanceDeg} 200 292)`}>
          <circle cx="200" cy="292" r="12" fill="none" stroke="#D0DCE8" strokeWidth="2.2"/>
          <line x1="188" y1="292" x2="212" y2="292" stroke="#C0CCE0" strokeWidth="1.3"/>
          <line x1="200" y1="280" x2="200" y2="304" stroke="#C0CCE0" strokeWidth="1.3"/>
          <circle cx="200" cy="280" r="3"   fill="#C8D4E4"/>
          <circle cx="200" cy="304" r="3"   fill="#C8D4E4"/>
          <circle cx="188" cy="292" r="2.2" fill="#C8D4E4"/>
          <circle cx="212" cy="292" r="2.2" fill="#C8D4E4"/>
        </g>

        {/* Center ruby jewel */}
        <circle cx="200" cy="292" r="4.5" fill="url(#ap_ruby)"/>
        <circle cx="200" cy="292" r="2.5" fill="#FF6060" opacity="0.45"/>
        <ellipse cx="199" cy="291" rx="1.5" ry="1" fill="#FFB0B0" opacity="0.65"/>
      </g>

      {/* Aperture bevel ring (drawn over rotating cage) */}
      <circle cx="200" cy="292" r="30" fill="none" stroke="url(#ap_tourbMetal)" strokeWidth="2.5" opacity="0.9"/>
      <circle cx="200" cy="292" r="33" fill="none" stroke="#202830" strokeWidth="1"/>

      {/* SWISS · MADE */}
      <text x="176" y="336" textAnchor="middle" fill="#4A7098"
        fontSize="6" fontFamily="Georgia,serif" letterSpacing="1.2" opacity="0.7">
        SWISS
      </text>
      <text x="224" y="336" textAnchor="middle" fill="#4A7098"
        fontSize="6" fontFamily="Georgia,serif" letterSpacing="1.2" opacity="0.7">
        MADE
      </text>

      {/* ══ CRYSTAL GLARE ══ */}
      <ellipse cx="148" cy="140" rx="52" ry="28"
        fill="white" opacity="0.038"
        transform="rotate(-38 148 140)"
        filter="url(#ap_crystalGlare)"/>

      {/* ══ MINUTE HAND ══ */}
      <g transform={`rotate(${minDeg} 200 200)`} filter="url(#ap_handShadow)">
        <polygon points="198.4,62 201.6,62 202.2,200 197.8,200" fill="url(#ap_hand)"/>
        <polygon points="199.1,67 200.9,67 201.5,198 198.5,198" fill="url(#ap_lume)" opacity="0.9"/>
        <polygon points="198.4,62 201.6,62 200,49" fill="url(#ap_hand)"/>
        <polygon points="197.8,201 202.2,201 202.8,221 197.2,221" fill="url(#ap_hand)"/>
      </g>

      {/* ══ HOUR HAND ══ */}
      <g transform={`rotate(${hrDeg} 200 200)`} filter="url(#ap_handShadow)">
        <polygon points="197.2,85 202.8,85 203.4,200 196.6,200" fill="url(#ap_hand)"/>
        <polygon points="198.3,90 201.7,90 202.2,198 197.8,198" fill="url(#ap_lume)" opacity="0.9"/>
        <polygon points="197.2,85 202.8,85 200,71" fill="url(#ap_hand)"/>
        <polygon points="196.6,201 203.4,201 204.5,218 195.5,218" fill="url(#ap_hand)"/>
      </g>

      {/* ══ CENTER CAP ══ */}
      <circle cx="200" cy="200" r="9.5" fill="url(#ap_steelMain)" stroke="#38383E" strokeWidth="1.5"/>
      <circle cx="200" cy="200" r="6.5" fill="url(#ap_screw)"/>
      <ellipse cx="198.5" cy="198" rx="2.8" ry="2" fill="#F2F2F6" opacity="0.48"/>

      {/* ══ CROWN ══ */}
      <rect x="377" y="192" width="23" height="16" rx="5" fill="url(#ap_steelFlat)" stroke="#505058" strokeWidth="0.8"/>
      {Array.from({ length: 5 }, (_, i) => (
        <line key={i} x1={380 + i * 4} y1={193} x2={380 + i * 4} y2={207}
          stroke="#808090" strokeWidth="0.7"/>
      ))}
    </svg>
  )
}
