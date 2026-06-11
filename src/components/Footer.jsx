import { Link } from 'react-router-dom'
import { Reveal } from './motion'

const C = {
  primary:   '#EAF2FF',
  secondary: '#94A3B8',
  muted:     '#6E7A8F',
}

export default function Footer() {
  const links = [
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
    { label: 'Pricing', to: '/pricing' },
  ]

  return (
    <footer style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 24px' }}>
      <Reveal amount={0.4} y={20} style={{
        maxWidth: 1120,
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <p style={{ fontSize: 13, color: C.muted }}>
          AutoPilot © 2026
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {links.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="nav-underline"
              style={{ fontSize: 13, color: C.secondary, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.primary)}
              onMouseLeave={e => (e.currentTarget.style.color = C.secondary)}
            >
              {label}
            </Link>
          ))}
        </div>
      </Reveal>
    </footer>
  )
}
