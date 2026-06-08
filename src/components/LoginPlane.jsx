import { useEffect, useState } from 'react'

// Cinematic post-login transition: a detailed airplane arcs from the
// bottom-left up toward the top-right over 1.2s, trailing a dotted contrail,
// then the pure-black overlay fades out as it exits and the dashboard takes over.
export default function LoginPlane({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Begin fading the black veil as the plane nears the top-right exit…
    const fadeT = setTimeout(() => setFading(true), 1000)
    // …then hand off to the dashboard once the 1.2s arc completes.
    const doneT = setTimeout(() => onDone?.(), 1200)
    return () => { clearTimeout(fadeT); clearTimeout(doneT) }
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000000',
        overflow: 'hidden',
        opacity: fading ? 0 : 1,
        transition: 'opacity 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: 0, height: 0,
          animation: 'loginPlaneArc 1.2s cubic-bezier(0.45, 0.05, 0.35, 1) forwards',
          willChange: 'transform',
        }}
      >
        {/* SVG sits to the LEFT of the wrapper origin so the trail extends backwards.
            Plane nose at the right end; dotted contrail fades out toward the tail. */}
        <svg
          width="220" height="80" viewBox="0 0 220 80"
          style={{ position: 'absolute', right: -18, top: -40, overflow: 'visible' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="apTrailFade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#4A8EFF" stopOpacity="0" />
              <stop offset="100%" stopColor="#4A8EFF" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="apPlaneBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#BFD4FF" />
            </linearGradient>
          </defs>

          {/* Dotted contrail */}
          <line
            x1="6" y1="40" x2="176" y2="40"
            stroke="url(#apTrailFade)" strokeWidth="3"
            strokeLinecap="round" strokeDasharray="2 12"
          />

          {/* Detailed airplane — fuselage, swept wings, tail fin */}
          <g transform="translate(150 40) rotate(-2)">
            {/* glow */}
            <ellipse cx="14" cy="0" rx="34" ry="14" fill="#4A8EFF" opacity="0.18" />
            {/* upper swept wing */}
            <path d="M2 -2 L-22 -26 L-12 -26 L18 -4 Z" fill="#9CC0FF" />
            {/* lower swept wing */}
            <path d="M2 2 L-22 26 L-12 26 L18 4 Z" fill="#7FA9F5" />
            {/* tail fin */}
            <path d="M-26 0 L-40 -12 L-34 -1 L-40 10 Z" fill="#BFD4FF" />
            {/* fuselage */}
            <path
              d="M-34 0 C-20 -7, 8 -8, 36 0 C8 8, -20 7, -34 0 Z"
              fill="url(#apPlaneBody)" stroke="#E6EEFF" strokeWidth="0.5"
            />
            {/* cockpit window */}
            <circle cx="24" cy="0" r="2.4" fill="#2A3A66" />
            {/* cabin windows */}
            <g fill="#3A5599">
              <circle cx="14" cy="0" r="1.3" />
              <circle cx="7"  cy="0" r="1.3" />
              <circle cx="0"  cy="0" r="1.3" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  )
}
