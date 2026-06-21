import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'

const API_URL = import.meta.env.VITE_API_URL || 'https://autopilot-production-7671.up.railway.app'

function CheckIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 3 }}>
      <path d="M3 8.5L6 11.5L13 4.5" stroke={color || '#22D3EE'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 4 }}>
      <rect x="3" y="7.5" width="10" height="7.5" rx="1.5" stroke="#6E7A8F" strokeWidth="1.5" />
      <path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" stroke="#6E7A8F" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const plans = [
  {
    id: 'starter',
    label: 'Starter',
    subtitle: 'For restaurants just getting started',
    monthly: 99,
    yearly: 999,
    yearlySavings: null,
    accentColor: 'var(--ap-text2)',
    checkColor: '#22D3EE',
    features: [
      { text: 'Google review replies (up to 100/mo)' },
      { text: 'Basic dashboard' },
      { text: 'Email support' },
      { text: 'Social media posting', locked: true },
      { text: 'Analytics', locked: true },
      { text: 'Support messaging', locked: true },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    subtitle: 'More automation, more platforms',
    monthly: 200,
    yearly: 2000,
    yearlySavings: 400,
    badge: 'Most Popular',
    accentColor: '#22D3EE',
    checkColor: '#22D3EE',
    featured: true,
    features: [
      { text: 'Everything in Starter' },
      { text: 'Unlimited review replies' },
      { text: 'Social media posting' },
      { text: 'Analytics dashboard' },
      { text: 'Two-way support messaging' },
      { text: 'Priority support' },
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    subtitle: 'For restaurants that want everything',
    monthly: 350,
    yearly: 3500,
    yearlySavings: 700,
    accentColor: '#3B82F6',
    checkColor: '#3B82F6',
    features: [
      { text: 'Everything in Growth' },
      { text: 'Custom brand voice training' },
      { text: 'Dedicated onboarding call' },
      { text: 'Same-day support' },
      { text: 'Early access to new features' },
      { text: 'White-glove setup & migration' },
    ],
  },
]

export default function Upgrade() {
  const navigate = useNavigate()
  const { C, userId, plan: currentPlan } = useApp()
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  async function handleSelect(planId) {
    if (planId === currentPlan) return
    setLoading(planId)
    setError('')
    try {
      localStorage.setItem('ap_selected_plan', planId)
      localStorage.setItem('ap_selected_interval', yearly ? 'yearly' : 'monthly')
      const res = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: planId, interval: yearly ? 'yearly' : 'monthly' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(null)
    }
  }

  return (
    <div className="ap-page px-8 py-8" style={{ maxWidth: 860 }}>

      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/dashboard/subscription')}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: C.secondary, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = C.primary}
          onMouseLeave={e => e.currentTarget.style.color = C.secondary}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to subscription
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: C.primary, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          Upgrade your plan
        </h1>
        <p className="text-sm" style={{ color: C.secondary }}>
          Choose the plan that fits your restaurant. Cancel or change anytime.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="flex items-center"
          style={{
            background: C.inputBg,
            border: `1px solid ${C.border}`,
            borderRadius: 980,
            padding: 4,
          }}
        >
          <button
            onClick={() => setYearly(false)}
            className="text-sm font-semibold transition-colors"
            style={{
              padding: '6px 18px', borderRadius: 980, border: 'none', cursor: 'pointer',
              background: !yearly ? C.accent : 'transparent',
              color: !yearly ? 'var(--ap-on-accent)' : C.secondary,
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className="flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{
              padding: '6px 18px', borderRadius: 980, border: 'none', cursor: 'pointer',
              background: yearly ? C.accent : 'transparent',
              color: yearly ? 'var(--ap-on-accent)' : C.secondary,
            }}
          >
            Yearly
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 980,
              background: yearly ? 'rgba(4,20,26,0.2)' : 'rgba(34,211,238,0.15)',
              color: yearly ? 'var(--ap-on-accent)' : '#22D3EE',
            }}>
              2 months free
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 20,
          fontSize: 13, color: 'rgb(239,68,68)',
        }}>
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const price = yearly ? plan.yearly : plan.monthly
          const isCurrentPlan = plan.id === currentPlan
          const isLoading = loading === plan.id

          return (
            <div
              key={plan.id}
              style={{
                background: C.card,
                border: plan.featured
                  ? `2px solid rgba(34,211,238,0.5)`
                  : `1px solid ${C.border}`,
                borderRadius: 20,
                padding: '28px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: C.glassFilter,
                WebkitBackdropFilter: C.glassFilter,
                boxShadow: plan.featured
                  ? '0 0 40px rgba(34,211,238,0.08)'
                  : C.cardShadow,
                position: 'relative',
              }}
            >
              {/* Badge */}
              {plan.badge ? (
                <div style={{ marginBottom: 14 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    padding: '3px 10px', borderRadius: 980,
                    background: 'rgba(34,211,238,0.14)',
                    color: '#22D3EE',
                    border: '1px solid rgba(34,211,238,0.30)',
                  }}>
                    {plan.badge}
                  </span>
                </div>
              ) : (
                <div style={{ height: 26, marginBottom: 14 }} />
              )}

              {/* Plan name */}
              <p style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 18, fontWeight: 700,
                color: C.primary, marginBottom: 4,
              }}>
                {plan.label}
              </p>
              <p style={{ fontSize: 13, color: C.secondary, marginBottom: 20, lineHeight: 1.5 }}>
                {plan.subtitle}
              </p>

              {/* Price */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontSize: 48, fontWeight: 800, lineHeight: 0.9,
                    letterSpacing: '-0.03em', color: C.primary,
                  }}>
                    ${price.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 14, color: C.secondary, marginBottom: 6 }}>
                    /{yearly ? 'yr' : 'mo'}
                  </span>
                </div>
                {yearly && plan.yearlySavings ? (
                  <p style={{ fontSize: 12, color: '#22D3EE', fontWeight: 600, marginTop: 6 }}>
                    Save ${plan.yearlySavings} · 2 months free
                  </p>
                ) : (
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                    Billed {yearly ? 'annually' : 'monthly'}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: C.divider, marginBottom: 18 }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <li key={f.text} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 9,
                    padding: '4px 0', fontSize: 13,
                    color: f.locked ? C.muted : C.primary,
                  }}>
                    {f.locked ? <LockIcon /> : <CheckIcon color={plan.checkColor} />}
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => !isCurrentPlan && handleSelect(plan.id)}
                disabled={isCurrentPlan || isLoading}
                className="w-full text-sm font-semibold py-3 rounded-xl transition-opacity"
                style={{
                  border: 'none', cursor: isCurrentPlan ? 'default' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  background: isCurrentPlan
                    ? C.inputBg
                    : plan.featured
                      ? C.accent
                      : plan.id === 'pro'
                        ? '#3B82F6'
                        : C.inputBg,
                  color: isCurrentPlan
                    ? C.muted
                    : plan.featured || plan.id === 'pro'
                      ? 'var(--ap-on-accent)'
                      : C.primary,
                  border: isCurrentPlan || (!plan.featured && plan.id !== 'pro')
                    ? `1px solid ${C.border}`
                    : 'none',
                }}
                onMouseEnter={e => { if (!isCurrentPlan && !isLoading) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = isLoading ? '0.7' : '1' }}
              >
                {isLoading
                  ? 'Loading…'
                  : isCurrentPlan
                    ? 'Current plan'
                    : plan.id === 'starter' && currentPlan !== 'starter'
                      ? 'Downgrade'
                      : 'Upgrade →'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-center mt-6" style={{ color: C.muted }}>
        All plans include a 14-day free trial. Cancel or change anytime.
      </p>
    </div>
  )
}
