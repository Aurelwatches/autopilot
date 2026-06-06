import { useEffect, useState } from 'react'
import { smoothScrollTo } from '../utils/smoothScroll'

// ── Staggered fade-in ────────────────────────────────────────────────────────
function useFadeIn(delayMs) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setOn(true), delayMs)
    return () => clearTimeout(id)
  }, [delayMs])
  return {
    opacity:    on ? 1 : 0,
    transform:  on ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.65s ease-out, transform 0.65s ease-out',
  }
}

// ── Notification card ────────────────────────────────────────────────────────
function Card({ style, children }) {
  return (
    <div style={{
      position: 'absolute',
      backgroundColor: '#111111',
      border: '1px solid #222222',
      borderRadius: 12,
      padding: '10px 15px',
      fontSize: 13,
      color: '#F0EEE9',
      whiteSpace: 'nowrap',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function Dot({ pulse }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 7, height: 7, borderRadius: '50%',
      backgroundColor: '#4A8EFF',
      flexShrink: 0,
      animation: pulse ? 'cardPulse 2s ease-out infinite' : 'none',
    }} />
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────
export default function Hero() {
  const s0 = useFadeIn(0)
  const s1 = useFadeIn(200)
  const s2 = useFadeIn(400)
  const s3 = useFadeIn(600)
  const s4 = useFadeIn(800)

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      backgroundColor: '#0A0A0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      paddingTop: 140,
      paddingBottom: 80,
      paddingLeft: 24,
      paddingRight: 24,
    }}>

      {/* Subtle radial glow behind headline */}
      <div style={{
        position: 'absolute',
        top: '35%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 680, height: 480,
        background: 'radial-gradient(ellipse at center, rgba(74,142,255,0.04) 0%, transparent 65%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 820 }}>

        {/* Eyebrow */}
        <p style={{
          ...s0,
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: '0.02em',
          color: '#6e6e73',
          marginBottom: 20,
        }}>
          AI automation for restaurants
        </p>

        {/* Headline */}
        <h1 style={{
          ...s1,
          fontSize: 'clamp(48px, 7.5vw, 80px)',
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: '-0.025em',
          color: '#F0EEE9',
          marginBottom: 24,
        }}>
          Your restaurant
          <br />
          runs itself.
        </h1>

        {/* Subheadline */}
        <p style={{
          ...s2,
          fontSize: 21,
          lineHeight: 1.55,
          color: '#6e6e73',
          maxWidth: 560,
          margin: '0 auto 42px',
        }}>
          AutoPilot handles Google reviews, social posts, and customer
          follow-ups — automatically.
        </p>

        {/* Buttons */}
        <div style={{
          ...s3,
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <a
            href="#waitlist"
            onClick={e => { e.preventDefault(); smoothScrollTo('waitlist') }}
            style={{
              display: 'inline-block',
              backgroundColor: '#F0EEE9',
              color: '#0A0A0A',
              borderRadius: 980,
              padding: '12px 28px',
              fontSize: 17,
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
              color: '#4A8EFF',
              border: '1px solid rgba(74,142,255,0.5)',
              borderRadius: 980,
              padding: '12px 28px',
              fontSize: 17,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'border-color 0.15s, background-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#4A8EFF'
              e.currentTarget.style.backgroundColor = 'rgba(74,142,255,0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(74,142,255,0.5)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            See how it works
          </a>
        </div>
      </div>

      {/* Floating notification cards — fade in at 800ms, bob at different phases */}
      <div style={{ ...s4, position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>

        {/* Card 1 — bottom-left */}
        <Card style={{
          bottom: '22%', left: 'max(28px, 7%)',
          animation: 'cardBob 4s ease-in-out infinite',
          animationDelay: '0s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dot pulse={false} />
            <span style={{ fontWeight: 500 }}>Review replied</span>
            <span style={{ color: '#6e6e73', marginLeft: 2 }}>· 2s ago</span>
          </div>
        </Card>

        {/* Card 2 — top-right */}
        <Card style={{
          top: '24%', right: 'max(28px, 7%)',
          animation: 'cardBob 4s ease-in-out infinite',
          animationDelay: '1.4s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: '#4A8EFF', fontSize: 14, lineHeight: 1 }}>★</span>
            <span style={{ fontWeight: 500 }}>4.9</span>
            <span style={{ color: '#6e6e73' }}>avg rating this month</span>
          </div>
        </Card>

        {/* Card 3 — bottom-right */}
        <Card style={{
          bottom: '26%', right: 'max(28px, 7%)',
          animation: 'cardBob 4s ease-in-out infinite',
          animationDelay: '2.7s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dot pulse={true} />
            <span style={{ fontWeight: 500 }}>AutoPilot is running</span>
          </div>
        </Card>

      </div>
    </section>
  )
}
