import { Link } from 'react-router-dom'

const C = {
  primary:   '#F0EEE9',
  secondary: '#888888',
  muted:     '#555555',
}

export default function Footer() {
  const links = [
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
    { label: 'Pricing', to: '/pricing' },
  ]

  return (
    <footer style={{ borderTop: '1px solid #1A1A1A', padding: '32px 24px' }}>
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
