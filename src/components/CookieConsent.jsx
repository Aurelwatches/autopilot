import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'ap_cookie_consent'

// First-visit cookie banner. Once accepted, the choice is stored in
// localStorage and the banner never shows again.
export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, 'accepted') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 60,
        maxWidth: 720, margin: '0 auto',
        backgroundColor: '#141414', border: '1px solid #2A2A2A', borderRadius: 12,
        padding: '16px 20px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}
    >
      <p style={{ flex: 1, minWidth: 240, fontSize: 13, lineHeight: 1.5, color: '#888780', margin: 0 }}>
        We use cookies to keep you signed in and to operate AutoPilot. By using the site you agree to
        our{' '}
        <Link to="/privacy" style={{ color: '#4A90D9' }}>Privacy Policy</Link>.
      </p>
      <button
        onClick={accept}
        style={{
          fontSize: 13, fontWeight: 600, padding: '9px 20px', borderRadius: 8,
          backgroundColor: '#F0EEE9', color: '#0A0A0A', border: 'none', cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e4e2dd')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F0EEE9')}
      >
        Accept
      </button>
    </div>
  )
}
