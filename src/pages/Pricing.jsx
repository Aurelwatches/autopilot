import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const features = [
  'Google review replies',
  'Social media posting',
  'Analytics dashboard',
  'Two-way support messaging',
  'Unlimited automations',
  'New features as they launch',
]

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M3 8.5L6 11.5L13 4.5" stroke="#4A8EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Pricing() {
  const [shown,        setShown]        = useState(false)
  const [yearly,       setYearly]       = useState(false)
  const [priceVisible, setPriceVisible] = useState(true)

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function switchPlan(toYearly) {
    if (toYearly === yearly) return
    // Fade price out, swap value, fade back in
    setPriceVisible(false)
    setTimeout(() => {
      setYearly(toYearly)
      setPriceVisible(true)
    }, 160)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000', color: '#F0EEE9' }}>
      <Navbar />

      <main style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '140px 24px 100px',
        gap: 32,
      }}>

        {/* Gradient glow blobs */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: '8%', left: '50%',
            width: 640, height: 640,
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #3B0764 0%, transparent 70%)',
            opacity: 0.35,
            filter: 'blur(50px)',
            animation: 'heroBlobA 15s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '2%', left: '50%',
            width: 680, height: 680,
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #0C1A4E 0%, transparent 70%)',
            opacity: 0.35,
            filter: 'blur(50px)',
            animation: 'heroBlobB 15s ease-in-out infinite',
          }} />
        </div>

        {/* Monthly / Yearly pill toggle */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 980,
            padding: 4,
            opacity: shown ? 1 : 0,
            transform: shown ? 'translateY(0)' : 'translateY(8px)',
            transition: `opacity 500ms ${EASE}, transform 500ms ${EASE}`,
          }}
        >
          {/* Monthly */}
          <button
            onClick={() => switchPlan(false)}
            style={{
              position: 'relative',
              padding: '7px 20px',
              borderRadius: 980,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: !yearly ? '#FFFFFF' : 'transparent',
              color: !yearly ? '#000000' : '#888888',
              transition: `background 200ms ${EASE}, color 200ms ${EASE}`,
            }}
          >
            Monthly
          </button>

          {/* Yearly */}
          <button
            onClick={() => switchPlan(true)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 20px',
              borderRadius: 980,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: yearly ? '#FFFFFF' : 'transparent',
              color: yearly ? '#000000' : '#888888',
              transition: `background 200ms ${EASE}, color 200ms ${EASE}`,
            }}
          >
            Yearly
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 980,
              background: yearly ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)',
              color: '#22C55E',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
            }}>
              Save $400
            </span>
          </button>
        </div>

        {/* Glass plan card */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 480,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
          padding: '40px 36px',
          opacity: shown ? 1 : 0,
          transform: shown ? 'scale(1)' : 'scale(0.97)',
          transition: `opacity 600ms ${EASE}, transform 600ms ${EASE}`,
          transitionDelay: '60ms',
        }}>

          {/* Label */}
          <p style={{ fontSize: 13, fontWeight: 500, color: '#888888', marginBottom: 20 }}>
            AutoPilot
          </p>

          {/* Animated price block */}
          <div style={{
            opacity: priceVisible ? 1 : 0,
            transform: priceVisible ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity 160ms ease, transform 160ms ease',
          }}>
            {/* Price row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.04em', color: '#FFFFFF' }}>
                {yearly ? '$2,000' : '$200'}
              </span>
              <span style={{ fontSize: 18, color: '#888888', marginBottom: 14 }}>
                {yearly ? '/ year' : '/ month'}
              </span>
            </div>

            {/* Billing line */}
            <p style={{ fontSize: 14, color: '#888888', marginBottom: yearly ? 16 : 0 }}>
              {yearly ? 'Billed once annually' : 'Billed monthly, cancel anytime'}
            </p>

            {/* Yearly savings badges */}
            {yearly && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path d="M3 8.5L6 11.5L13 4.5" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 14, color: '#22C55E', fontWeight: 500 }}>Save $400 vs monthly</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path d="M3 8.5L6 11.5L13 4.5" stroke="#4A8EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 14, color: '#4A8EFF', fontWeight: 500 }}>2 months free</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 22 }}>
                  <span style={{ fontSize: 13, color: '#888888' }}>16% off</span>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '24px 0' }} />

          {/* Feature list */}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginBottom: 32 }}>
            {features.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', fontSize: 15, color: '#F0EEE9' }}>
                <Check />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link
            to="/signup"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              borderRadius: 980,
              padding: '14px 0',
              fontSize: 16,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {yearly ? 'Get started — save $400' : 'Start free trial'}
          </Link>

          <p style={{ fontSize: 12, color: '#888888', textAlign: 'center', marginTop: 16 }}>
            {yearly ? 'Billed annually · Cancel anytime' : '14 days free · No credit card required'}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
