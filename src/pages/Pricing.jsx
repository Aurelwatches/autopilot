import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const features = [
  'Google review replies',
  'Social media posting',
  'Customer follow-up texts',
  'Analytics dashboard',
  'Two-way support messaging',
  'Unlimited automations',
]

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M3 8.5L6 11.5L13 4.5" stroke="#4A8EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Pricing() {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000', color: '#F0EEE9' }}>
      <Navbar />

      <main style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '140px 24px 100px',
      }}>
        {/* Subtle gradient glow behind the card — hero style */}
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
        }}>
          {/* Label */}
          <p style={{ fontSize: 13, fontWeight: 500, color: '#888888', marginBottom: 20 }}>
            AutoPilot
          </p>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.04em', color: '#FFFFFF' }}>
              $200
            </span>
            <span style={{ fontSize: 18, color: '#888888', marginBottom: 14 }}>/month</span>
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.5, color: '#888888', marginBottom: 28 }}>
            Less than one hour of labor. Works 24/7.
          </p>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

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
            Start free trial
          </Link>

          <p style={{ fontSize: 12, color: '#888888', textAlign: 'center', marginTop: 16 }}>
            14 days free · No credit card required
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
