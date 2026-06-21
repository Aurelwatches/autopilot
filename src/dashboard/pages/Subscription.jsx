import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'
import { getPlanMeta, getBillingInterval, planPrice } from '../planMeta'

const API_URL = import.meta.env.VITE_API_URL || 'https://autopilot-production-7671.up.railway.app'

// Next billing date: anchored once in localStorage, then advanced by the
// billing interval until it lands in the future. Stable across renders.
function nextBillingDate(interval) {
  let anchor = localStorage.getItem('ap_billing_anchor')
  if (!anchor) {
    anchor = new Date().toISOString()
    localStorage.setItem('ap_billing_anchor', anchor)
  }
  const next = new Date(anchor)
  const now = new Date()
  let guard = 0
  while (next <= now && guard++ < 240) {
    if (interval === 'yearly') next.setFullYear(next.getFullYear() + 1)
    else next.setMonth(next.getMonth() + 1)
  }
  return next.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function Row({ label, children, C, last }) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: last ? 'none' : `1px solid ${C.divider}` }}
    >
      <span className="text-sm" style={{ color: C.secondary }}>{label}</span>
      <div className="text-sm font-medium" style={{ color: C.primary }}>{children}</div>
    </div>
  )
}

function SadFace() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <circle cx="28" cy="28" r="25" stroke="#3B82F6" strokeWidth="2.5" opacity="0.5" />
      <circle cx="20" cy="24" r="2.6" fill="#3B82F6" />
      <circle cx="36" cy="24" r="2.6" fill="#3B82F6" />
      <path d="M19 39c2.4-4 6-6 9-6s6.6 2 9 6" stroke="#3B82F6" strokeWidth="2.6"
        strokeLinecap="round" fill="none" />
      <path d="M40 17l3 1.5" stroke="#3B82F6" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export default function Subscription() {
  const navigate = useNavigate()
  const { C, plan, userId } = useApp()

  const meta     = getPlanMeta(plan)
  const planKey  = meta.key
  const interval = getBillingInterval()
  const isYearly = interval === 'yearly'
  const price    = planPrice(meta, interval)
  const yearlySavings = meta.monthly * 12 - meta.yearly

  const [showCancel,   setShowCancel]   = useState(false)
  const [canceled,     setCanceled]     = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError,   setPortalError]   = useState('')

  async function handleCancelConfirm() {
    setPortalLoading(true)
    setPortalError('')
    try {
      const res = await fetch(`${API_URL}/api/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to open portal')
      window.location.href = data.url
    } catch (err) {
      setPortalError(err.message)
      setPortalLoading(false)
    }
  }

  function changeToYearly() {
    localStorage.setItem('ap_selected_plan', planKey)
    localStorage.setItem('ap_selected_interval', 'yearly')
    navigate('/checkout')
  }

  return (
    <div className="ap-page px-8 py-8" style={{ maxWidth: 660 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: C.primary, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Subscription</h1>
        <p className="text-sm" style={{ color: C.secondary }}>Manage your AutoPilot plan and billing</p>
      </div>

      {/* Current plan card */}
      <div style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: 'hidden', marginBottom: 24,
        backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
        boxShadow: C.cardShadow,
      }}>
        <div className="px-6 py-6" style={{ borderBottom: `1px solid ${C.divider}` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Large plan name in its accent color */}
              <div className="flex items-center gap-2.5 mb-1.5">
                <h2 style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em',
                  color: meta.color, lineHeight: 1,
                }}>
                  {meta.emoji ? `${meta.emoji} ` : ''}{meta.label}
                </h2>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  padding: '3px 10px', borderRadius: 980,
                  background: canceled ? 'rgba(59,130,246,0.14)' : 'rgba(34,211,238,0.14)',
                  color: canceled ? '#3B82F6' : '#22D3EE',
                  border: `1px solid ${canceled ? 'rgba(59,130,246,0.30)' : 'rgba(34,211,238,0.30)'}`,
                }}>
                  {canceled ? 'CANCELING' : 'ACTIVE'}
                </span>
              </div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>
                You’re on the {meta.label} plan
              </p>
              <p className="text-sm mt-0.5" style={{ color: C.secondary }}>{meta.blurb}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: C.primary }}>
                ${price.toLocaleString()}
              </span>
              <span className="text-sm" style={{ color: C.secondary }}>/{isYearly ? 'year' : 'month'}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-1">
          <Row label="Billing interval" C={C}>
            {isYearly ? 'Yearly' : 'Monthly'}
          </Row>
          <Row label={canceled ? 'Access until' : 'Next billing date'} C={C} last>
            {nextBillingDate(interval)}
          </Row>
        </div>
      </div>

      {canceled && (
        <div style={{
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
        }}>
          <p className="text-sm font-medium" style={{ color: '#3B82F6' }}>
            Your subscription is set to cancel
          </p>
          <p className="text-xs mt-1" style={{ color: C.secondary }}>
            You’ll keep full access until {nextBillingDate(interval)}. Change your mind anytime —
            just pick a plan again to stay on AutoPilot.
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: 'hidden', marginBottom: 24,
        backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
        boxShadow: C.cardShadow,
      }}>
        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${C.divider}` }}>
          <h2 className="text-sm font-semibold" style={{ color: C.primary }}>Manage plan</h2>
        </div>
        <div className="px-6 py-5 space-y-4">

          {/* Upgrade */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>Upgrade plan</p>
              <p className="text-xs mt-0.5" style={{ color: C.secondary }}>
                Unlock more features by moving to a higher tier.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/upgrade')}
              className="shrink-0 text-sm font-semibold px-5 py-2 rounded transition-colors"
              style={{ backgroundColor: C.accent, color: 'var(--ap-on-accent)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Upgrade plan
            </button>
          </div>

          {/* Switch to yearly — only when on monthly */}
          {!isYearly && (
            <>
              <div className="h-px" style={{ backgroundColor: C.divider }} />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: C.primary }}>Switch to yearly</p>
                  <p className="text-xs mt-0.5" style={{ color: C.secondary }}>
                    Pay annually and{' '}
                    <span style={{ color: 'var(--ap-success)', fontWeight: 600 }}>
                      save ${yearlySavings.toLocaleString()}
                    </span>{' '}
                    — that’s 2 months free.
                  </p>
                </div>
                <button
                  onClick={changeToYearly}
                  className="shrink-0 text-sm font-semibold px-5 py-2 rounded transition-colors"
                  style={{
                    backgroundColor: 'rgba(34,211,238,0.12)', color: 'var(--ap-success)',
                    border: '1px solid rgba(34,211,238,0.30)', cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(34,211,238,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(34,211,238,0.12)'}
                >
                  Change to yearly
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cancel */}
      <div style={{
        backgroundColor: C.card, border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 16, overflow: 'hidden',
        backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
        boxShadow: C.cardShadow,
      }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'rgb(239,68,68)' }}>Cancel subscription</h2>
        </div>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <p className="text-xs" style={{ color: C.secondary }}>
            Your account will stay active until the end of the current billing period.
          </p>
          <button
            onClick={() => setShowCancel(true)}
            disabled={canceled}
            className="shrink-0 text-sm font-medium px-4 py-2 rounded transition-colors"
            style={{
              color: 'rgb(239,68,68)', border: '1px solid rgba(239,68,68,0.3)',
              backgroundColor: 'rgba(239,68,68,0.06)',
              cursor: canceled ? 'default' : 'pointer', opacity: canceled ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!canceled) e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)' }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)'}
          >
            {canceled ? 'Cancellation scheduled' : 'Cancel subscription'}
          </button>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancel && (
        <div
          onClick={() => setShowCancel(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(8,8,12,0.7)',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, animation: 'chatPopIn 200ms ease-out',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 420,
              backgroundColor: C.card, border: `1px solid ${C.border}`,
              borderRadius: 20, padding: '32px 28px', textAlign: 'center',
              backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <SadFace />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: C.primary }}>We’ll miss you</h3>
            <p className="text-sm mb-7" style={{ color: C.secondary, lineHeight: 1.6 }}>
              Are you sure you want to cancel? AutoPilot keeps replying to reviews and posting
              for you around the clock — your restaurant loses that the moment your plan ends.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setShowCancel(false)}
                disabled={portalLoading}
                className="w-full text-sm font-semibold py-2.5 rounded-lg transition-colors"
                style={{ backgroundColor: C.accent, color: 'var(--ap-on-accent)', cursor: portalLoading ? 'default' : 'pointer', opacity: portalLoading ? 0.5 : 1 }}
                onMouseEnter={e => { if (!portalLoading) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => e.currentTarget.style.opacity = portalLoading ? '0.5' : '1'}
              >
                Never mind, keep my plan
              </button>
              {portalError && (
                <p className="text-xs text-center" style={{ color: 'rgb(239,68,68)' }}>{portalError}</p>
              )}
              <button
                onClick={handleCancelConfirm}
                disabled={portalLoading}
                className="w-full text-sm font-medium py-2.5 rounded-lg transition-colors"
                style={{
                  color: 'rgb(239,68,68)', border: '1px solid rgba(239,68,68,0.3)',
                  backgroundColor: 'transparent', cursor: portalLoading ? 'default' : 'pointer',
                  opacity: portalLoading ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!portalLoading) e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)' }}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {portalLoading ? 'Opening portal…' : 'Cancel anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
