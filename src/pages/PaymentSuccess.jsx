import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import LoginPlane from '../components/LoginPlane'

const REDIRECT_MS = 3000

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const restaurantName =
    user?.user_metadata?.restaurant_name ||
    localStorage.getItem('ap_restaurant') ||
    'your restaurant'

  const [flyPlane, setFlyPlane] = useState(false)

  useEffect(() => {
    // Payment is complete — clear the pending plan selection so future logins
    // don't bounce the user back to checkout.
    localStorage.removeItem('ap_selected_plan')
    localStorage.removeItem('ap_selected_interval')

    // Let the plane sweep across mid-celebration…
    const planeT = setTimeout(() => setFlyPlane(true), 900)
    // …then head into the dashboard.
    const goT = setTimeout(() => navigate('/dashboard'), REDIRECT_MS)
    return () => { clearTimeout(planeT); clearTimeout(goT) }
  }, [navigate])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 35%, #15130F 0%, #0B0A09 70%)',
        color: '#F5F1E8',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 24,
      }}
    >
      {/* Animated checkmark */}
      <div style={{ animation: 'apSuccessPop 600ms cubic-bezier(0.16, 1, 0.3, 1) both', marginBottom: 32 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true"
          style={{ filter: 'drop-shadow(0 0 28px rgba(22,199,132,0.45))' }}>
          <circle cx="60" cy="60" r="52" fill="rgba(22,199,132,0.07)" />
          <circle
            className="ap-success-circle"
            cx="60" cy="60" r="52" fill="none"
            stroke="#16C784" strokeWidth="4" strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
          <path
            className="ap-success-check"
            d="M38 62 L54 78 L84 44" fill="none"
            stroke="#16C784" strokeWidth="5"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 800,
        letterSpacing: '-0.03em', color: '#FBF9F4', margin: '0 0 14px',
        animation: 'apFadeUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 900ms both',
      }}>
        You’re all set!
      </h1>

      <p style={{
        fontSize: 17, color: '#A39B8E', maxWidth: 460, lineHeight: 1.6, margin: '0 0 36px',
        animation: 'apFadeUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 1050ms both',
      }}>
        Welcome to AutoPilot, <span style={{ color: '#F5F1E8', fontWeight: 600 }}>{restaurantName}</span>.
        Your automation is ready.
      </p>

      <button
        onClick={() => navigate('/dashboard')}
        style={{
          background: '#FB7A1E', color: '#2A1606',
          border: 'none', borderRadius: 980,
          padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(251,122,30,0.45)',
          transition: 'background-color 0.15s, box-shadow 0.15s',
          animation: 'apFadeUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 1200ms both',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FF8C3A' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#FB7A1E' }}
      >
        Go to dashboard →
      </button>

      {/* Same cinematic jet as login, overlaid transparently */}
      {flyPlane && <LoginPlane transparent />}
    </div>
  )
}
