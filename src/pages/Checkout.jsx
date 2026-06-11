import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || 'https://autopilot-production-7671.up.railway.app'

const PLAN_LABELS  = { starter: 'Starter', growth: 'Growth', pro: 'AutoPilot Pro' }
const PLAN_PRICES  = {
  starter: { monthly: 99,  yearly: 999  },
  growth:  { monthly: 200, yearly: 2000 },
  pro:     { monthly: 350, yearly: 3500 },
}

const V = {
  bg:     'var(--ap-bg)',
  card:   'var(--ap-card-solid)',
  border: 'var(--ap-border-solid)',
  text:   'var(--ap-text)',
  text2:  'var(--ap-text2)',
  text3:  'var(--ap-text3b)',
  shadow: 'var(--ap-shadow)',
}

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [plan]     = useState(() => localStorage.getItem('ap_selected_plan') || '')
  const [interval] = useState(() => localStorage.getItem('ap_selected_interval') || 'monthly')
  const [loading,    setLoading]  = useState(false)
  const [error,      setError]    = useState('')

  useEffect(() => {
    if (!plan || !PLAN_PRICES[plan]) {
      navigate('/pricing', { replace: true })
    }
  }, [plan, navigate])

  const label  = PLAN_LABELS[plan] || ''
  const price  = PLAN_PRICES[plan]?.[interval] ?? 0
  const period = interval === 'yearly' ? 'yr' : 'mo'

  async function handleCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval, userId: user?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session')
      window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!plan || !PLAN_PRICES[plan]) return null

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: V.bg }}
    >
      <Link to="/" className="flex items-center gap-2 mb-10" style={{ color: V.text }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
            stroke="var(--ap-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-base font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>AutoPilot</span>
      </Link>

      <div
        style={{
          width: '100%', maxWidth: 420,
          backgroundColor: V.card,
          border: `1px solid ${V.border}`,
          borderRadius: 20,
          backdropFilter: 'var(--ap-blur)',
          WebkitBackdropFilter: 'var(--ap-blur)',
          boxShadow: V.shadow,
          padding: '36px 32px',
        }}
      >
        {/* Plan summary */}
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: V.text2, marginBottom: 8 }}>
          Your plan
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: V.text, marginBottom: 4 }}>
          AutoPilot {label}
        </h1>
        <p style={{ fontSize: 13, color: V.text2, marginBottom: 28 }}>
          {interval === 'yearly' ? 'Billed annually' : 'Billed monthly'}
        </p>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'var(--ap-divider)', marginBottom: 24 }} />

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.03em', color: V.text }}>
            ${price.toLocaleString()}
          </span>
          <span style={{ fontSize: 15, color: V.text2, marginBottom: 8 }}>/{period}</span>
        </div>

        {interval === 'yearly' && PLAN_PRICES[plan] && (
          <p style={{ fontSize: 13, color: 'var(--ap-success)', fontWeight: 600, marginBottom: 28 }}>
            Save ${((PLAN_PRICES[plan].monthly * 12) - PLAN_PRICES[plan].yearly).toLocaleString()} vs monthly
          </p>
        )}

        {interval === 'monthly' && <div style={{ marginBottom: 28 }} />}

        {/* Error */}
        {error && (
          <p style={{ fontSize: 13, color: 'var(--ap-danger)', marginBottom: 16, padding: '10px 14px', background: 'var(--ap-danger-soft)', borderRadius: 8 }}>
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            display: 'block', width: '100%', padding: '14px 0',
            borderRadius: 980, border: 'none',
            backgroundColor: 'var(--ap-accent)',
            color: 'var(--ap-on-accent)',
            opacity: loading ? 0.6 : 1,
            boxShadow: loading ? 'none' : '0 8px 28px rgba(251,122,30,0.4)',
            fontSize: 15, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            transition: 'opacity 0.15s, background-color 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--ap-accent-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--ap-accent)' }}
        >
          {loading ? 'Redirecting to payment…' : 'Complete payment'}
        </button>

        <p style={{ fontSize: 12, color: V.text3, textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          Secured by Stripe. Cancel anytime.
        </p>
      </div>

      <p className="text-xs mt-6" style={{ color: V.text3 }}>
        <Link to="/pricing" style={{ color: V.text2 }}>← Change plan</Link>
      </p>
    </div>
  )
}
