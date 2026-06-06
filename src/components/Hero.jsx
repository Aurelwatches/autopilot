import { useEffect, useState } from 'react'
import ShaderBackground from './ShaderBackground'
import { smoothScrollTo } from '../utils/smoothScroll'

// ── Staggered fade-in hook ────────────────────────────────────────────────────
function useFadeIn(delayMs) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(id)
  }, [delayMs])
  return visible
}

function fadeStyle(visible) {
  return {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
  }
}

// ── Notification cards ────────────────────────────────────────────────────────
function Dot({ color, pulse }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 7, height: 7, borderRadius: '50%',
      backgroundColor: color, flexShrink: 0,
      boxShadow: pulse ? `0 0 0 0 ${color}` : 'none',
      animation: pulse ? 'cardPulse 2s ease-out infinite' : 'none',
    }} />
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      position: 'absolute',
      backgroundColor: '#111111',
      border: '1px solid #222222',
      borderRadius: 12,
      padding: '10px 14px',
      fontSize: 13,
      color: '#f5f5f7',
      whiteSpace: 'nowrap',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Hero() {
  const eyebrow  = useFadeIn(0)
  const headline = useFadeIn(200)
  const sub      = useFadeIn(400)
  const buttons  = useFadeIn(600)
  const cards    = useFadeIn(800)

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      backgroundColor: '#000000',
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

      {/* WebGL shader background */}
      <ShaderBackground />

      {/* Radial glow behind the headline */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700,
        height: 500,
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 65%)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 900 }}>

        {/* Eyebrow — delay 0ms */}
        <p style={{
          ...fadeStyle(eyebrow),
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: '0.02em',
          color: '#6e6e73',
          marginBottom: 20,
        }}>
          Introducing AutoPilot
        </p>

        {/* Headline — delay 200ms */}
        <h1 style={{
          ...fadeStyle(headline),
          fontSize: 'clamp(48px, 8vw, 80px)',
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: '#f5f5f7',
          marginBottom: 24,
        }}>
          Your restaurant
          <br />
          runs itself.
        </h1>

        {/* Sub — delay 400ms */}
        <p style={{
          ...fadeStyle(sub),
          fontSize: 21,
          lineHeight: 1.5,
          color: '#6e6e73',
          maxWidth: 560,
          margin: '0 auto 40px',
        }}>
          AutoPilot handles Google reviews, social posts, and customer
          follow-ups — automatically.
        </p>

        {/* Buttons — delay 600ms */}
        <div style={{
          ...fadeStyle(buttons),
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
              backgroundColor: '#ffffff',
              color: '#000000',
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
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: 980,
              padding: '12px 28px',
              fontSize: 17,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#fff'
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            See how it works
          </a>
        </div>
      </div>

      {/* Floating notification cards — delay 800ms */}
      {/* Each card has a different bob animation delay so they don't sync */}
      <div style={{ ...fadeStyle(cards), position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>

        {/* Card 1 — bottom-left: review replied */}
        <Card style={{
          bottom: '18%',
          left: 'max(24px, 6%)',
          animation: 'cardBob 4s ease-in-out infinite',
          animationDelay: '0s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dot color="#30d158" pulse={false} />
            <span>Review replied</span>
            <span style={{ color: '#6e6e73', marginLeft: 4 }}>· 2s ago</span>
          </div>
        </Card>

        {/* Card 2 — top-right: rating */}
        <Card style={{
          top: '22%',
          right: 'max(24px, 6%)',
          animation: 'cardBob 4s ease-in-out infinite',
          animationDelay: '1.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#E8A020', fontSize: 14, lineHeight: 1 }}>★</span>
            <span>4.9</span>
            <span style={{ color: '#6e6e73' }}>avg rating this month</span>
          </div>
        </Card>

        {/* Card 3 — bottom-right: running status */}
        <Card style={{
          bottom: '22%',
          right: 'max(24px, 6%)',
          animation: 'cardBob 4s ease-in-out infinite',
          animationDelay: '2.6s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dot color="#30d158" pulse={true} />
            <span>AutoPilot is running</span>
          </div>
        </Card>

      </div>
    </section>
  )
}
