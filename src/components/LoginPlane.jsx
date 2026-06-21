import { useEffect, useState } from 'react'

// Cinematic post-login transition — opening-of-a-luxury-commercial energy.
// A massive commercial jet sweeps diagonally across a pure-black screen
// (bottom-left → top-right) over 1.4s, banked ~15deg with twin contrails,
// then it transitions straight to the dashboard the moment the plane exits.
// transparent=true overlays the plane on top of existing content (no black veil,
// no wordmark, no auto-redirect) — used on the payment-success page. Default mode
// is the full black login takeoff that calls onDone when the plane exits.
export default function LoginPlane({ onDone, transparent = false }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (transparent) return
    // A quick veil blend right as the plane clears the edge…
    const fadeT = setTimeout(() => setFading(true), 1250)
    // …then hand straight off to the dashboard the moment the plane exits.
    const doneT = setTimeout(() => onDone?.(), 1400)
    return () => { clearTimeout(fadeT); clearTimeout(doneT) }
  }, [onDone, transparent])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: transparent ? 'transparent' : '#000000',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 180ms cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
      }}
    >
      {/* Subtle wordmark behind the plane (full takeoff mode only) */}
      {!transparent && (
        <span
          style={{
            position: 'absolute',
            fontSize: 'clamp(20px, 3vw, 38px)',
            fontWeight: 600, letterSpacing: '0.28em',
            textTransform: 'uppercase', color: '#FFFFFF',
            animation: 'loginTitleFade 1.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
            paddingLeft: '0.28em',
          }}
        >
          AutoPilot
        </span>
      )}

      {/* The aircraft — centered by flex, then flown by the keyframe transform.
          ~46vw wide so it reads as a jet passing close to the camera. */}
      <svg
        viewBox="0 0 1000 520"
        style={{
          width: '46vw', height: 'auto', overflow: 'visible',
          animation: 'loginPlaneArc 1.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
          willChange: 'transform',
          filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))',
        }}
        aria-hidden="true"
      >
        <defs>
          {/* Twin contrails — opaque at the engines, fading to nothing far behind */}
          <linearGradient id="apTrail" gradientUnits="userSpaceOnUse" x1="-1400" y1="0" x2="430" y2="0">
            <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.7" />
          </linearGradient>
          {/* Fuselage: bright white with a faint top-light gradient */}
          <linearGradient id="apFuse" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FFFFFF" />
            <stop offset="55%"  stopColor="#FBFCFE" />
            <stop offset="100%" stopColor="#E4E8EF" />
          </linearGradient>
          {/* Wings: subtle gray shading */}
          <linearGradient id="apWing" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#EDEFF4" />
            <stop offset="100%" stopColor="#C5CCD8" />
          </linearGradient>
          <linearGradient id="apWingLower" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#C5CCD8" />
            <stop offset="100%" stopColor="#AEB6C6" />
          </linearGradient>
        </defs>

        {/* ── Twin dotted contrails streaming back from the engines ── */}
        <g stroke="url(#apTrail)" strokeWidth="13" strokeLinecap="round" strokeDasharray="1 46">
          <line x1="-1380" y1="196" x2="440" y2="196" />
          <line x1="-1380" y1="324" x2="440" y2="324" />
        </g>

        {/* ── Aircraft, nose pointing right ── */}
        {/* Horizontal stabilizers (tail wings) */}
        <path d="M250 260 L150 150 L120 158 L210 260 Z" fill="url(#apWingLower)" />
        <path d="M250 260 L150 370 L120 362 L210 260 Z" fill="url(#apWingLower)" />

        {/* Vertical stabilizer (top-down: slim fin off the tail) */}
        <path d="M235 260 L120 238 L150 260 L120 282 Z" fill="#D2D8E2" />

        {/* Main wings — wide and swept back */}
        <path d="M560 244 L300 70 L250 78 L470 250 Z" fill="url(#apWing)" />
        <path d="M560 276 L300 450 L250 442 L470 270 Z" fill="url(#apWingLower)" />

        {/* Engines slung under each wing */}
        <g>
          <ellipse cx="452" cy="196" rx="58" ry="20" fill="#9AA3B4" />
          <ellipse cx="470" cy="196" rx="40" ry="16" fill="#C9D0DC" />
          <ellipse cx="408" cy="196" rx="9"  ry="18" fill="#5B647A" />
        </g>
        <g>
          <ellipse cx="452" cy="324" rx="58" ry="20" fill="#8A93A6" />
          <ellipse cx="470" cy="324" rx="40" ry="16" fill="#BAC2D0" />
          <ellipse cx="408" cy="324" rx="9"  ry="18" fill="#4E576C" />
        </g>

        {/* Fuselage — long body, pointed nose at the right */}
        <path
          d="M150 260
             C 150 236, 200 224, 320 222
             C 520 219, 720 226, 858 248
             C 892 253, 900 257, 900 260
             C 900 263, 892 267, 858 272
             C 720 294, 520 301, 320 298
             C 200 296, 150 284, 150 260 Z"
          fill="url(#apFuse)" stroke="#D7DCE6" strokeWidth="1.5"
        />

        {/* Wing roots blended onto the fuselage */}
        <ellipse cx="500" cy="260" rx="80" ry="30" fill="#EEF1F6" opacity="0.6" />

        {/* Cockpit windows near the nose */}
        <path d="M812 250 q26 0 40 10 q-16 6 -40 6 Z" fill="#28324A" />

        {/* Cabin window line */}
        <g fill="#A9B2C2">
          {Array.from({ length: 22 }).map((_, i) => (
            <rect key={i} x={250 + i * 25} y={256} width="11" height="3.4" rx="1.6" />
          ))}
        </g>
      </svg>
    </div>
  )
}
