import { useEffect, useState } from 'react'
import ThreeAirplane from './ThreeAirplane'
import { smoothScrollTo } from '../utils/smoothScroll'

function useFadeIn(delayMs) {
  const [on, setOn] = useState(false)
  useEffect(() => { const id = setTimeout(() => setOn(true), delayMs); return () => clearTimeout(id) }, [])
  return { opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(18px)', transition: 'opacity 0.65s ease-out, transform 0.65s ease-out' }
}

export default function Hero() {
  const s0 = useFadeIn(80)
  const s1 = useFadeIn(240)
  const s2 = useFadeIn(420)
  const s3 = useFadeIn(600)

  return (
    <section style={{
      backgroundColor: '#000000',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      paddingTop: 80,
      paddingBottom: 40,
      overflow: 'hidden',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 6%',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 64,
        alignItems: 'center',
      }}
        className="hero-grid-override"
      >

        {/* ── Left: copy ───────────────────────────────────────────────────── */}
        <div>
          {/* Eyebrow */}
          <p style={{
            ...s0,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.02em',
            color: '#6e6e73',
            marginBottom: 18,
          }}>
            AI automation for restaurants
          </p>

          {/* Headline */}
          <h1 style={{
            ...s1,
            fontSize: 'clamp(44px, 5vw, 64px)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            color: '#f5f5f7',
            marginBottom: 24,
          }}>
            Your restaurant<br />runs itself.
          </h1>

          {/* Subheadline */}
          <p style={{
            ...s2,
            fontSize: 18,
            lineHeight: 1.6,
            color: '#6e6e73',
            maxWidth: 460,
            marginBottom: 40,
          }}>
            AutoPilot handles Google reviews, social posts, and customer
            follow-ups — automatically.
          </p>

          {/* Buttons */}
          <div style={{ ...s3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href="#waitlist"
              onClick={e => { e.preventDefault(); smoothScrollTo('waitlist') }}
              style={{
                display: 'inline-block',
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRadius: 980,
                padding: '13px 28px',
                fontSize: 16,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Start free trial
            </a>
            <a
              href="#features"
              onClick={e => { e.preventDefault(); smoothScrollTo('features') }}
              style={{
                display: 'inline-block',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.45)',
                borderRadius: 980,
                padding: '13px 28px',
                fontSize: 16,
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'border-color 0.15s, background-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#fff'
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              See how it works
            </a>
          </div>
        </div>

        {/* ── Right: 3D scene ──────────────────────────────────────────────── */}
        <div style={{ height: '75vh', minHeight: 520, maxHeight: 780 }}>
          <ThreeAirplane />
        </div>

      </div>
    </section>
  )
}
