import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#0A0A0A' }}>
      <Navbar />
      <main style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '0 24px',
      }}>
        <svg width="40" height="40" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ marginBottom: 24 }}>
          <path
            d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
            stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
          404
        </h1>
        <p style={{ fontSize: 18, color: '#6B7280', marginBottom: 36 }}>
          This page doesn't exist.
        </p>
        <Link
          to="/"
          style={{
            backgroundColor: '#22D3EE', color: '#04141A',
            padding: '12px 28px', borderRadius: 980,
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(34,211,238,0.25)',
          }}
        >
          Back to home
        </Link>
      </main>
    </div>
  )
}
