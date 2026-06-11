import { Link } from 'react-router-dom'

const C = {
  primary:   '#F5F1E8',
  secondary: '#A39B8E',
  muted:     '#6E665B',
}

export default function Footer() {
  const links = [
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
    { label: 'Pricing', to: '/pricing' },
  ]

  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 24px', backgroundColor: '#0B0A09' }}>
      <div style={{
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
              style={{ fontSize: 13, color: C.secondary, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.primary)}
              onMouseLeave={e => (e.currentTarget.style.color = C.secondary)}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
