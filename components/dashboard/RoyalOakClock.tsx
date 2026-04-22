'use client'

import { useEffect, useState } from 'react'

function pt(angleDeg: number, r: number, cx = 150, cy = 150) {
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

const SCREWS = [
  [100, 22], [200, 22], [278, 100], [278, 200],
  [200, 278], [100, 278], [22, 200], [22, 100],
]

export default function RoyalOakClock({ size = 220 }: { size?: number }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 50)
    return () => clearInterval(id)
  }, [])

  const h = now.getHours() % 12
  const m = now.getMinutes()
  const s = now.getSeconds()
  const ms = now.getMilliseconds()
  const secDeg = s * 6 + ms * 0.006
  const minDeg = m * 6 + s * 0.1
  const hrDeg  = h * 30 + m * 0.5

  return (
    <svg viewBox="0 0 300 300" width={size} height={size} style={{ display: 'block' }}>
      <defs>
        {/* ── Rose gold gradients ── */}
        <linearGradient id="rgOuter" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FBDCB0"/>
          <stop offset="22%"  stopColor="#E8A86A"/>
          <stop offset="55%"  stopColor="#C07838"/>
          <stop offset="78%"  stopColor="#8A4C1A"/>
          <stop offset="100%" stopColor="#5C2808"/>
        </linearGradient>
        <linearGradient id="rgCatch" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FEEFDA" stopOpacity="1"/>
          <stop offset="35%"  stopColor="#D49050" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#3A1000" stopOpacity="0.1"/>
        </linearGradient>
        <linearGradient id="rgInner" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#FBDCB0"/>
          <stop offset="50%"  stopColor="#B87040"/>
          <stop offset="100%" stopColor="#6A3010"/>
        </linearGradient>
        <radialGradient id="rgScrew" cx="32%" cy="28%" r="68%">
          <stop offset="0%"   stopColor="#FEEFDA"/>
          <stop offset="45%"  stopColor="#D09050"/>
          <stop offset="100%" stopColor="#5C2008"/>
        </radialGradient>

        {/* ── Dial ── */}
        <pattern id="tapisserie" x="0" y="0" width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#0C1B19"/>
          <rect x="0.7" y="0.7" width="5.6" height="5.6" fill="#132320" rx="0.9"/>
          <rect x="1.6" y="1.6" width="3.8" height="3.8" fill="#192D2A" rx="0.5"/>
        </pattern>
        <radialGradient id="dialSheen" cx="38%" cy="33%" r="72%">
          <stop offset="0%"   stopColor="#284844" stopOpacity="0.85"/>
          <stop offset="55%"  stopColor="#0A1614" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#030A09" stopOpacity="0.98"/>
        </radialGradient>

        {/* ── Hands / markers ── */}
        <linearGradient id="handRg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#8A4A18"/>
          <stop offset="38%"  stopColor="#ECC070"/>
          <stop offset="62%"  stopColor="#ECC070"/>
          <stop offset="100%" stopColor="#8A4A18"/>
        </linearGradient>
        <linearGradient id="lume" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#D8EEE8"/>
          <stop offset="100%" stopColor="#80C0B4"/>
        </linearGradient>

        {/* ── Filters ── */}
        <filter id="fOuter" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="7" stdDeviation="12" floodColor="#000" floodOpacity="0.92"/>
        </filter>
        <filter id="fHand" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="1" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.7"/>
        </filter>
        <filter id="fGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* ── Clips ── */}
        <clipPath id="bezClip">
          <polygon points="100,22 200,22 278,100 278,200 200,278 100,278 22,200 22,100"/>
        </clipPath>
      </defs>

      {/* ══ OUTER SHADOW ══ */}
      <polygon points="100,22 200,22 278,100 278,200 200,278 100,278 22,200 22,100"
        fill="#3A1004" filter="url(#fOuter)"/>

      {/* ══ MAIN BEZEL ══ */}
      <polygon points="100,22 200,22 278,100 278,200 200,278 100,278 22,200 22,100"
        fill="url(#rgOuter)"/>
      {/* Top-left catch light */}
      <polygon points="100,22 200,22 278,100 278,200 200,278 100,278 22,200 22,100"
        fill="none" stroke="url(#rgCatch)" strokeWidth="7"/>

      {/* ══ BEZEL BRUSHED FACETS (alternating sides) ══ */}
      {/* Horizontal brushed sides (top & bottom) */}
      {[
        "100,22 200,22 196,34 104,34",
        "100,278 200,278 196,266 104,266",
      ].map((pts, i) => (
        <polygon key={i} points={pts} fill="#C07838" opacity="0.45"/>
      ))}
      {/* Vertical brushed sides (left & right) */}
      {[
        "22,100 34,104 34,196 22,200",
        "278,100 266,104 266,196 278,200",
      ].map((pts, i) => (
        <polygon key={i} points={pts} fill="#D09050" opacity="0.35"/>
      ))}

      {/* ══ INNER BEZEL STEP ══ */}
      <polygon points="107,37 193,37 263,107 263,193 193,263 107,263 37,193 37,107"
        fill="#1A0804" stroke="#0E0402" strokeWidth="2"/>
      <polygon points="107,37 193,37 263,107 263,193 193,263 107,263 37,193 37,107"
        fill="url(#rgInner)" opacity="0.2"/>

      {/* ══ 8 SCREWS ══ */}
      {SCREWS.map(([sx, sy], i) => (
        <g key={i}>
          {/* Shadow ring */}
          <circle cx={sx} cy={sy} r="11.5" fill="#200802"/>
          {/* Body */}
          <circle cx={sx} cy={sy} r="10"   fill="url(#rgScrew)"/>
          {/* Knurled edge */}
          <circle cx={sx} cy={sy} r="10"   fill="none" stroke="#3A1408" strokeWidth="1.2"/>
          {/* Hexagonal slot lines */}
          {[0, 60, 120].map(a => {
            const r1x = sx + 5.5 * Math.cos(a * Math.PI / 180)
            const r1y = sy + 5.5 * Math.sin(a * Math.PI / 180)
            const r2x = sx - 5.5 * Math.cos(a * Math.PI / 180)
            const r2y = sy - 5.5 * Math.sin(a * Math.PI / 180)
            return <line key={a} x1={r1x} y1={r1y} x2={r2x} y2={r2y}
              stroke="#2A0C04" strokeWidth="1.8" strokeLinecap="round"/>
          })}
          {/* Highlight */}
          <ellipse cx={sx - 2.5} cy={sy - 3} rx="3" ry="2" fill="#FEEFDA" opacity="0.35"/>
        </g>
      ))}

      {/* ══ CRYSTAL RING ══ */}
      <circle cx="150" cy="150" r="120" fill="#06100F" stroke="#1A0802" strokeWidth="4"/>
      <circle cx="150" cy="150" r="117" fill="#06100F"/>

      {/* ══ DIAL ══ */}
      <circle cx="150" cy="150" r="115" fill="url(#tapisserie)"/>
      <circle cx="150" cy="150" r="115" fill="url(#dialSheen)"/>

      {/* Chapter ring */}
      <circle cx="150" cy="150" r="114" fill="none" stroke="#C07838" strokeWidth="1.5" opacity="0.55"/>
      <circle cx="150" cy="150" r="108" fill="none" stroke="#7A4018" strokeWidth="0.6" opacity="0.4"/>

      {/* ══ MINUTE TICKS ══ */}
      {Array.from({ length: 60 }, (_, i) => {
        const p1 = pt(i * 6, 107)
        const isH = i % 5 === 0
        const p2 = pt(i * 6, isH ? 99 : 103.5)
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke={isH ? '#D09050' : '#4A2C14'}
          strokeWidth={isH ? 2 : 0.9}
          opacity={isH ? 1 : 0.55}/>
      })}

      {/* ══ APPLIED HOUR MARKERS ══ */}
      {Array.from({ length: 12 }, (_, i) => {
        const ang = i * 30
        const c = pt(ang, 91)
        const lpts = rectPts(c.x, c.y, ang, 7, 2)
        return (
          <g key={i} filter="url(#fGlow)">
            {/* Rose gold body */}
            <polygon points={rectPts(c.x, c.y, ang, 12, 4.5)} fill="url(#handRg)"/>
            <polygon points={rectPts(c.x, c.y, ang, 12, 4.5)} fill="none"
              stroke="#ECC070" strokeWidth="0.4" opacity="0.6"/>
            {/* Lume insert */}
            <polygon points={lpts} fill="url(#lume)" opacity="0.75"/>
          </g>
        )
      })}

      {/* ══ BRAND TEXT ══ */}
      <text x="150" y="107" textAnchor="middle" fill="#C08840"
        fontSize="7.5" fontFamily="Georgia,Times New Roman,serif" letterSpacing="2.8" opacity="0.95">
        AUDEMARS PIGUET
      </text>
      <text x="150" y="120" textAnchor="middle" fill="#A06828"
        fontSize="5.8" fontFamily="Georgia,Times New Roman,serif" letterSpacing="2" opacity="0.78">
        ROYAL OAK
      </text>
      <text x="150" y="131" textAnchor="middle" fill="#784E1A"
        fontSize="4.8" fontFamily="Georgia,Times New Roman,serif" letterSpacing="1.8" opacity="0.6">
        TOURBILLON
      </text>
      <text x="150" y="187" textAnchor="middle" fill="#6A4018"
        fontSize="4.5" fontFamily="Georgia,Times New Roman,serif" letterSpacing="2.5" opacity="0.5">
        SWISS MADE
      </text>

      {/* ══ TOURBILLON CAGE (6 o'clock) ══ */}
      <circle cx="150" cy="208" r="18"  fill="none" stroke="#C07838" strokeWidth="1.8" opacity="0.75"/>
      <circle cx="150" cy="208" r="16"  fill="#080F0E" stroke="#5A2C0C" strokeWidth="1.2"/>
      {/* Rotating cage */}
      <g transform={`rotate(${secDeg * 1} 150 208)`}>
        <ellipse cx="150" cy="208" rx="11" ry="7" fill="none" stroke="#D09050" strokeWidth="1.2" opacity="0.85"/>
        <line x1="139" y1="208" x2="161" y2="208" stroke="#A06828" strokeWidth="1" opacity="0.7"/>
        <line x1="150" y1="197" x2="150" y2="219" stroke="#A06828" strokeWidth="1" opacity="0.7"/>
        <circle cx="150" cy="208" r="3" fill="#D09050" stroke="#8A4820" strokeWidth="0.8"/>
      </g>
      {/* Tourbillon corner screws */}
      {[0, 90, 180, 270].map(a => {
        const tp = pt(a, 15, 150, 208)
        return <circle key={a} cx={tp.x} cy={tp.y} r="1.8" fill="#A06828"/>
      })}

      {/* ══ MINUTE HAND ══ */}
      <g transform={`rotate(${minDeg} 150 150)`} filter="url(#fHand)">
        {/* Body */}
        <polygon points="148.3,57 151.7,57 152.2,150 147.8,150" fill="url(#handRg)"/>
        {/* Lume */}
        <polygon points="149.1,62 150.9,62 151.4,148 148.6,148" fill="url(#lume)" opacity="0.8"/>
        {/* Tail */}
        <polygon points="147.5,151 152.5,151 153.5,170 146.5,170" fill="url(#handRg)"/>
      </g>

      {/* ══ HOUR HAND ══ */}
      <g transform={`rotate(${hrDeg} 150 150)`} filter="url(#fHand)">
        {/* Body */}
        <polygon points="147,74 153,74 153.5,150 146.5,150" fill="url(#handRg)"/>
        {/* Lume */}
        <polygon points="148.1,79 151.9,79 152.4,148 147.6,148" fill="url(#lume)" opacity="0.8"/>
        {/* Tail */}
        <polygon points="146,151 154,151 155,167 145,167" fill="url(#handRg)"/>
      </g>

      {/* ══ SECOND HAND ══ */}
      <g transform={`rotate(${secDeg} 150 150)`}>
        {/* Stem */}
        <rect x="149.2" y="58" width="1.6" height="99" rx="0.8" fill="#C84820"/>
        {/* Tip arrow */}
        <polygon points="150,50 147.5,62 152.5,62" fill="#C84820"/>
        {/* Tail */}
        <rect x="148.5" y="159" width="3" height="24" rx="1.5" fill="#C84820"/>
        {/* Counterweight lollipop */}
        <circle cx="150" cy="176" r="7" fill="none" stroke="#C84820" strokeWidth="1.8"/>
        <circle cx="150" cy="176" r="2.5" fill="#C84820"/>
      </g>

      {/* ══ CENTER CAP ══ */}
      <circle cx="150" cy="150" r="8"   fill="url(#rgOuter)" stroke="#3A1408" strokeWidth="1.5"/>
      <circle cx="150" cy="150" r="5"   fill="url(#rgScrew)"/>
      <ellipse cx="147.5" cy="147" rx="2" ry="1.5" fill="#FEEFDA" opacity="0.45"/>
    </svg>
  )
}
