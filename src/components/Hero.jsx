import { useEffect, useState } from 'react'
import { smoothScrollTo } from '../utils/smoothScroll'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const SKELETON_MS = 1200

// ── Staggered reveal ─────────────────────────────────────────────────────────
function useReveal(delayMs, { scale = false, duration = 900 } = {}) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setOn(true), delayMs)
    return () => clearTimeout(id)
  }, [delayMs])
  const hidden = scale ? 'translateY(24px) scale(0.97)' : 'translateY(24px)'
  const shown  = scale ? 'translateY(0) scale(1)'       : 'translateY(0)'
  return {
    opacity:    on ? 1 : 0,
    transform:  on ? shown : hidden,
    transition: `opacity ${duration}ms ${EASE}, transform ${duration}ms ${EASE}`,
  }
}

// ── Glass notification card ──────────────────────────────────────────────────
function Card({ style, children }) {
  return (
    <div style={{
      position: 'relative',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: '12px 18px',
      fontSize: 13,
      color: '#F0EEE9',
      whiteSpace: 'nowrap',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Skeleton shape with left-to-right shimmer sweep ──────────────────────────
function Sk({ w, h, r = 4, delay = 0, style }) {
  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      width: w,
      height: h,
      borderRadius: r,
      backgroundColor: '#ffffff0f',
      ...style,
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
        animation: 'heroShimmer 1.8s linear infinite',
        animationDelay: `${delay}s`,
      }} />
    </div>
  )
}

// ── Skeleton placeholder layout ───────────────────────────────────────────────
function HeroSkeleton({ hidden }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      opacity: hidden ? 0 : 1,
      transition: 'opacity 300ms ease-out',
    }}>
      {/* Centered column mirrors the real content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Eyebrow */}
        <Sk w={120} h={12} r={6} delay={0} style={{ marginBottom: 28 }} />

        {/* Headline lines */}
        <Sk w="min(480px, 80vw)" h={72} r={12} delay={0.2} style={{ marginBottom: 14 }} />
        <Sk w="min(380px, 66vw)" h={72} r={12} delay={0.4} style={{ marginBottom: 28 }} />

        {/* Gradient line */}
        <Sk w={120} h={2} r={2} delay={0.6} style={{ marginBottom: 32 }} />

        {/* Subheadline lines */}
        <Sk w="min(440px, 76vw)" h={16} r={8} delay={0.8} style={{ marginBottom: 12 }} />
        <Sk w="min(320px, 60vw)" h={16} r={8} delay={1.0} style={{ marginBottom: 40 }} />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 14 }}>
          <Sk w={160} h={48} r={980} delay={1.2} />
          <Sk w={160} h={48} r={980} delay={1.4} />
        </div>
      </div>

      {/* Card outlines in their positions */}
      <div style={{ position: 'absolute', top: '52%', left: 'max(28px, 7%)' }}>
        <Sk w={170} h={44} r={16} delay={1.6} />
      </div>
      <div style={{ position: 'absolute', top: '28%', right: 'max(28px, 7%)' }}>
        <Sk w={195} h={44} r={16} delay={1.8} />
      </div>
      <div style={{ position: 'absolute', bottom: '20%', left: '50%', marginLeft: -130 }}>
        <Sk w={235} h={44} r={16} delay={2.0} />
      </div>
    </div>
  )
}

// ── Real hero content (mounts after skeleton, runs staggered reveals) ─────────
function HeroContent() {
  const eyebrow = useReveal(300)
  const head    = useReveal(500,  { scale: true })
  const line    = useReveal(700)
  const sub     = useReveal(900)
  const btns    = useReveal(1100)
  const card1   = useReveal(1300)
  const card2   = useReveal(1450)
  const card3   = useReveal(1600)

  return (
    <>
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 820 }}>

        {/* Eyebrow */}
        <p style={{
          ...eyebrow,
          fontSize: 13,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#888888',
          marginBottom: 24,
        }}>
          AI automation for restaurants
        </p>

        {/* Headline */}
        <h1 style={{
          ...head,
          fontSize: 'clamp(48px, 9vw, 88px)',
          fontWeight: 800,
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
          color: '#FFFFFF',
          marginBottom: 28,
        }}>
          Your restaurant
          <br />
          runs itself.
        </h1>

        {/* Glowing gradient line */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            height: 2,
            width: 120,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)',
            boxShadow: '0 0 12px rgba(139,92,246,0.7)',
            transformOrigin: 'left center',
            opacity: line.opacity,
            transform: line.opacity ? 'scaleX(1)' : 'scaleX(0)',
            transition: `opacity 700ms ${EASE}, transform 900ms ${EASE}`,
          }} />
        </div>

        {/* Subheadline */}
        <p style={{
          ...sub,
          fontSize: 19,
          lineHeight: 1.55,
          color: '#888888',
          maxWidth: 500,
          margin: '0 auto 40px',
        }}>
          AutoPilot handles Google reviews, social posts, and customer
          follow-ups — automatically.
        </p>

        {/* Buttons */}
        <div style={{
          ...btns,
          display: 'flex',
          gap: 14,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <a
            href="/signup"
            style={{
              display: 'inline-block',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              borderRadius: 980,
              padding: '13px 30px',
              fontSize: 17,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.15s, transform 0.15s',
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
              background: 'rgba(255,255,255,0.05)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 980,
              padding: '13px 30px',
              fontSize: 17,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'border-color 0.15s, background-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            }}
          >
            See how it works
          </a>
        </div>
      </div>

      {/* Floating notification cards */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>

        {/* Card 1 — left */}
        <div style={{ ...card1, position: 'absolute', top: '52%', left: 'max(28px, 7%)' }}>
          <Card style={{ animation: 'cardBob 4s ease-in-out infinite' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: '#22C55E', flexShrink: 0,
              }} />
              <span style={{ fontWeight: 500 }}>Review replied</span>
              <span style={{ color: '#888888' }}>· 2s ago</span>
            </div>
          </Card>
        </div>

        {/* Card 2 — right */}
        <div style={{ ...card2, position: 'absolute', top: '28%', right: 'max(28px, 7%)' }}>
          <Card style={{ animation: 'cardBob 5s ease-in-out infinite' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ color: '#3B82F6', fontSize: 14, lineHeight: 1 }}>★</span>
              <span style={{ fontWeight: 500 }}>4.9</span>
              <span style={{ color: '#888888' }}>avg rating this month</span>
            </div>
          </Card>
        </div>

        {/* Card 3 — bottom */}
        <div style={{ ...card3, position: 'absolute', bottom: '20%', left: '50%', marginLeft: -130 }}>
          <Card style={{ animation: 'cardBob 6s ease-in-out infinite' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span className="pulse-dot" style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: '#22C55E', flexShrink: 0,
              }} />
              <span style={{ fontWeight: 500 }}>AutoPilot is running</span>
              <span style={{ color: '#888888' }}>· 47 tasks today</span>
            </div>
          </Card>
        </div>

      </div>
    </>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────
export default function Hero() {
  const blobs = useReveal(0, { duration: 1000 })
  const [showReal, setShowReal] = useState(false)
  const [mountSkeleton, setMountSkeleton] = useState(true)

  useEffect(() => {
    // At 1.2s: reveal real content + start the 300ms skeleton fade-out
    const t1 = setTimeout(() => setShowReal(true), SKELETON_MS)
    // After the fade completes, drop the skeleton from the tree
    const t2 = setTimeout(() => setMountSkeleton(false), SKELETON_MS + 350)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

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

      {/* Breathing gradient blobs — visible behind both skeleton and content */}
      <div style={{ ...blobs, position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-15%', left: '-10%',
          width: 720, height: 720,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #3B0764 0%, transparent 70%)',
          opacity: 0.4,
          filter: 'blur(40px)',
          animation: 'heroBlobA 15s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%', right: '-10%',
          width: 760, height: 760,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #0C1A4E 0%, transparent 70%)',
          opacity: 0.4,
          filter: 'blur(40px)',
          animation: 'heroBlobB 15s ease-in-out infinite',
        }} />
      </div>

      {mountSkeleton && <HeroSkeleton hidden={showReal} />}
      {showReal && <HeroContent />}
    </section>
  )
}
