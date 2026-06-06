import { Link } from 'react-router-dom'
import { useInView } from '../utils/useInView'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const C = {
  primary:   '#F0EEE9',
  secondary: '#888888',
  muted:     '#555555',
}

export default function Pricing() {
  const [ref, inView] = useInView({ threshold: 0.3 })

  const reveal = {
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(40px)',
    transition: `opacity 700ms ${EASE}, transform 700ms ${EASE}`,
  }

  return (
    <section
      id="pricing"
      style={{ borderTop: '1px solid #1A1A1A', padding: '112px 24px', textAlign: 'center' }}
    >
      <div ref={ref} style={{ maxWidth: 640, margin: '0 auto', ...reveal }}>
        <p style={{
          fontSize: 12, fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: C.secondary, marginBottom: 20,
        }}>
          Pricing
        </p>

        <h2 style={{
          fontSize: 'clamp(36px, 6vw, 56px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: C.primary,
          marginBottom: 24,
        }}>
          Simple pricing.
        </h2>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 'clamp(56px, 9vw, 88px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: C.primary }}>
            $200
          </span>
          <span style={{ fontSize: 20, color: C.secondary, marginBottom: 12 }}>/ month</span>
        </div>

        <p style={{ fontSize: 18, lineHeight: 1.6, color: C.secondary, maxWidth: 420, margin: '0 auto 36px' }}>
          Everything you need to automate your restaurant.
        </p>

        <Link
          to="/pricing"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.05)',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 980,
            padding: '13px 28px',
            fontSize: 16,
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
          See full pricing →
        </Link>
      </div>
    </section>
  )
}
