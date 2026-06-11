import { Link } from 'react-router-dom'
import { useInView } from '../utils/useInView'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const C = {
  primary:   '#F5F1E8',
  secondary: '#A39B8E',
  muted:     '#6E665B',
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
      style={{ backgroundColor: '#0B0A09', padding: '112px 24px', textAlign: 'center' }}
    >
      <div ref={ref} style={{ maxWidth: 640, margin: '0 auto', ...reveal }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12, fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.18em', color: '#FB7A1E', marginBottom: 20,
        }}>
          Pricing
        </p>

        <h2 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 'clamp(36px, 6vw, 56px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: C.primary,
          marginBottom: 24,
        }}>
          Simple pricing.
        </h2>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(56px, 9vw, 88px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: C.primary }}>
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
            background: '#FB7A1E',
            color: '#2A1606',
            borderRadius: 980,
            padding: '13px 30px',
            fontSize: 16,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(251,122,30,0.4)',
            transition: 'background-color 0.15s, box-shadow 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FF8C3A'
            e.currentTarget.style.boxShadow = '0 10px 38px rgba(251,122,30,0.6)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#FB7A1E'
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(251,122,30,0.4)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          See full pricing →
        </Link>
      </div>
    </section>
  )
}
