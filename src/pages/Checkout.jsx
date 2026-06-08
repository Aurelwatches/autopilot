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
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-sm font-semibold tracking-tight">AutoPilot</span>
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
        <h1 style={{ fontSize: 24, fontWeight: 700, color: V.text, marginBottom: 4 }}>
          AutoPilot {label}
        </h1>
        <p style={{ fontSize: 13, color: V.text2, marginBottom: 28 }}>
          {interval === 'yearly' ? 'Billed annually' : 'Billed monthly'}
        </p>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'var(--ap-divider)', marginBottom: 24 }} />

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.03em', color: V.text }}>
            ${price.toLocaleString()}
          </span>
          <span style={{ fontSize: 15, color: V.text2, marginBottom: 8 }}>/{period}</span>
        </div>

        {interval === 'yearly' && PLAN_PRICES[plan] && (
          <p style={{ fontSize: 13, color: '#22C55E', fontWeight: 500, marginBottom: 28 }}>
            Save ${((PLAN_PRICES[plan].monthly * 12) - PLAN_PRICES[plan].yearly).toLocaleString()} vs monthly
          </p>
        )}

        {interval === 'monthly' && <div style={{ marginBottom: 28 }} />}

        {/* Error */}
        {error && (
          <p style={{ fontSize: 13, color: '#f87171', marginBottom: 16, padding: '10px 14px', background: 'rgba(248,113,113,0.08)', borderRadius: 8 }}>
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
            backgroundColor: loading ? 'rgba(10,10,10,0.4)' : V.text,
            color: V.bg,
            fontSize: 15, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
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
