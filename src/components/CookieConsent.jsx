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
        backgroundColor: 'var(--ap-card-solid)', border: '1px solid var(--ap-border-solid)', borderRadius: 12,
        padding: '16px 20px', boxShadow: 'var(--ap-popup-shadow)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}
    >
      <p style={{ flex: 1, minWidth: 240, fontSize: 13, lineHeight: 1.5, color: 'var(--ap-text2)', margin: 0 }}>
        We use cookies to keep you signed in and to operate AutoPilot. By using the site you agree to
        our{' '}
        <Link to="/privacy" style={{ color: 'var(--ap-accent)', fontWeight: 600 }}>Privacy Policy</Link>.
      </p>
      <button
        onClick={accept}
        style={{
          fontSize: 13, fontWeight: 700, padding: '9px 20px', borderRadius: 8,
          backgroundColor: 'var(--ap-accent)', color: 'var(--ap-on-accent)', border: 'none', cursor: 'pointer',
          whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(251,122,30,0.28)',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--ap-accent-hover)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--ap-accent)')}
      >
        Accept
      </button>
    </div>
  )
}
