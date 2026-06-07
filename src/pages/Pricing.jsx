import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../lib/auth'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 3 }}>
      <path d="M3 8.5L6 11.5L13 4.5" stroke="#4A8EFF" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 4 }}>
      <rect x="3" y="7.5" width="10" height="7.5" rx="1.5" stroke="#555555" strokeWidth="1.5" />
      <path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" stroke="#555555" strokeWidth="1.5"
        strokeLinecap="round" />
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
    badge: null,
    border: 'rgba(255,255,255,0.08)',
    shadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
    featured: false,
    buttonStyle: 'outlined',
    buttonText: 'Get started',
    socialProof: null,
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
    subtitle: 'For restaurants ready to automate',
    monthly: 200,
    yearly: 2000,
    yearlySavings: 400,
    badge: { text: 'Most Popular', color: '#4A8EFF', bg: 'rgba(74,142,255,0.12)', border: 'rgba(74,142,255,0.25)' },
    border: 'rgba(74,142,255,0.3)',
    shadow: '0 0 48px rgba(74,142,255,0.12), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
    featured: true,
    buttonStyle: 'white',
    buttonText: 'Start free trial',
    socialProof: null,
    features: [
      { text: 'Everything in Starter' },
      { text: 'Unlimited reviews' },
      { text: 'Social media posting' },
      { text: 'Analytics dashboard' },
      { text: 'Two-way support messaging' },
      { text: 'Priority support' },
    ],
  },
  {
    id: 'pro',
    label: 'AutoPilot Pro',
    subtitle: 'For restaurants that want everything',
    monthly: 350,
    yearly: 3500,
    yearlySavings: 700,
    badge: { text: 'Best Value', color: '#E8A020', bg: 'rgba(232,160,32,0.12)', border: 'rgba(232,160,32,0.25)' },
    border: 'rgba(232,160,32,0.3)',
    shadow: '0 0 48px rgba(232,160,32,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
    featured: false,
    buttonStyle: 'amber',
    buttonText: 'Get AutoPilot Pro',
    socialProof: 'Most restaurants on Pro save 3× their subscription in staff hours',
    features: [
      { text: 'Everything in Growth' },
      { text: 'AI phone answering', note: 'coming soon' },
      { text: 'Custom brand voice training' },
      { text: 'Dedicated onboarding call' },
      { text: 'Same-day support' },
      { text: 'Early access to new features' },
    ],
  },
]

function PlanCard({ plan, yearly, priceVisible, shown, delay }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const price  = yearly ? plan.yearly : plan.monthly
  const period = yearly ? 'yr' : 'mo'

  function handleSelect() {
    localStorage.setItem('ap_selected_plan', plan.id)
    localStorage.setItem('ap_selected_interval', yearly ? 'yearly' : 'monthly')
    if (user) {
      navigate('/checkout')
    } else {
      navigate('/signup')
    }
  }

  const btnBase = {
    display: 'block', width: '100%', textAlign: 'center',
    borderRadius: 980, padding: '13px 0',
    fontSize: 15, fontWeight: 600, textDecoration: 'none',
    border: 'none', cursor: 'pointer',
    transition: 'opacity 0.15s',
  }
  const btnStyles = {
    outlined: { ...btnBase, backgroundColor: 'transparent', color: '#888888', border: '1px solid rgba(255,255,255,0.14)' },
    white:    { ...btnBase, backgroundColor: '#FFFFFF', color: '#000000' },
    amber:    { ...btnBase, backgroundColor: '#E8A020', color: '#000000' },
  }

  return (
    <div
      className={plan.id === 'growth' ? 'order-first md:order-none' : ''}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${plan.border}`,
        borderRadius: 24,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: plan.shadow,
        padding: plan.featured ? '36px 32px 32px' : '32px 28px 28px',
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 600ms ${EASE}, transform 600ms ${EASE}`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Badge */}
      {plan.badge ? (
        <div style={{ marginBottom: 16 }}>
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.05em', padding: '4px 11px', borderRadius: 980,
            background: plan.badge.bg, color: plan.badge.color,
            border: `1px solid ${plan.badge.border}`,
          }}>
            {plan.badge.text}
          </span>
        </div>
      ) : (
        /* Spacer so non-badged cards align with badged ones */
        <div style={{ height: 32, marginBottom: 16 }} />
      )}

      {/* Label + subtitle */}
      <p style={{ fontSize: 18, fontWeight: 700, color: '#F0EEE9', marginBottom: 6 }}>
        {plan.label}
      </p>
      <p style={{ fontSize: 13, color: '#888888', marginBottom: 24, lineHeight: 1.5 }}>
        {plan.subtitle}
      </p>

      {/* Animated price block */}
      <div style={{
        marginBottom: 24,
        opacity: priceVisible ? 1 : 0,
        transform: priceVisible ? 'translateY(0)' : 'translateY(5px)',
        transition: 'opacity 160ms ease, transform 160ms ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 56, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.03em', color: '#FFFFFF' }}>
            ${price.toLocaleString()}
          </span>
          <span style={{ fontSize: 15, color: '#888888', marginBottom: 8 }}>/{period}</span>
        </div>

        {yearly && plan.yearlySavings ? (
          <p style={{ fontSize: 13, color: '#22C55E', fontWeight: 500 }}>
            Save ${plan.yearlySavings} · 2 months free
          </p>
        ) : (
          <p style={{ fontSize: 13, color: '#888888' }}>
            {yearly ? 'Billed annually' : 'Billed monthly'}
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />

      {/* Features */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, marginBottom: 28 }}>
        {plan.features.map((f) => (
          <li key={f.text} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '5px 0', fontSize: 14,
            color: f.locked ? '#555555' : '#E8E6E1',
          }}>
            {f.locked ? <LockIcon /> : <CheckIcon />}
            <span>
              {f.text}
              {f.note && (
                <span style={{
                  fontSize: 10, color: '#888888', marginLeft: 7,
                  padding: '2px 6px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  verticalAlign: 'middle',
                }}>
                  {f.note}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={handleSelect}
        style={btnStyles[plan.buttonStyle]}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        {plan.buttonText}
      </button>

      {/* Social proof */}
      {plan.socialProof && (
        <p style={{ fontSize: 12, color: '#888888', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          {plan.socialProof}
        </p>
      )}
    </div>
  )
}

export default function Pricing() {
  const [shown,        setShown]        = useState(false)
  const [yearly,       setYearly]       = useState(false)
  const [priceVisible, setPriceVisible] = useState(true)

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function switchPlan(toYearly) {
    if (toYearly === yearly) return
    setPriceVisible(false)
    setTimeout(() => {
      setYearly(toYearly)
      setPriceVisible(true)
    }, 160)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000', color: '#F0EEE9' }}>
      <Navbar />

      <main style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '120px 24px 100px',
        gap: 36,
      }}>

        {/* Gradient blobs */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '0%', left: '25%',
            width: 720, height: 720, borderRadius: '50%',
            background: 'radial-gradient(circle, #3B0764 0%, transparent 70%)',
            opacity: 0.28, filter: 'blur(60px)',
            animation: 'heroBlobA 15s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '0%', right: '15%',
            width: 640, height: 640, borderRadius: '50%',
            background: 'radial-gradient(circle, #0C1A4E 0%, transparent 70%)',
            opacity: 0.28, filter: 'blur(60px)',
            animation: 'heroBlobB 15s ease-in-out infinite',
          }} />
        </div>

        {/* Heading */}
        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center',
          opacity: shown ? 1 : 0,
          transform: shown ? 'translateY(0)' : 'translateY(12px)',
          transition: `opacity 500ms ${EASE}, transform 500ms ${EASE}`,
        }}>
          <h1 style={{
            fontSize: 'clamp(30px, 5vw, 50px)',
            fontWeight: 800, letterSpacing: '-0.03em',
            color: '#FFFFFF', margin: '0 0 12px',
          }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: 17, color: '#888888', margin: 0 }}>
            Start free. Scale when you're ready.
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'inline-flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 980, padding: 4,
          opacity: shown ? 1 : 0,
          transform: shown ? 'translateY(0)' : 'translateY(8px)',
          transition: `opacity 500ms ${EASE}, transform 500ms ${EASE}`,
          transitionDelay: '60ms',
        }}>
          <button
            onClick={() => switchPlan(false)}
            style={{
              padding: '7px 22px', borderRadius: 980,
              fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: !yearly ? '#FFFFFF' : 'transparent',
              color: !yearly ? '#000000' : '#888888',
              transition: `background 200ms ${EASE}, color 200ms ${EASE}`,
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => switchPlan(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 22px', borderRadius: 980,
              fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: yearly ? '#FFFFFF' : 'transparent',
              color: yearly ? '#000000' : '#888888',
              transition: `background 200ms ${EASE}, color 200ms ${EASE}`,
            }}
          >
            Yearly
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 7px',
              borderRadius: 980, lineHeight: 1.4, whiteSpace: 'nowrap',
              background: 'rgba(34,197,94,0.12)', color: '#22C55E',
            }}>
              2 months free
            </span>
          </button>
        </div>

        {/* Cards grid — Growth is first on mobile via CSS order */}
        <div
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 items-start"
          style={{ maxWidth: 1060, position: 'relative', zIndex: 1 }}
        >
          {plans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              yearly={yearly}
              priceVisible={priceVisible}
              shown={shown}
              delay={80 + i * 90}
            />
          ))}
        </div>

        {/* Footer trust lines */}
        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center',
          opacity: shown ? 1 : 0,
          transition: `opacity 700ms ${EASE}`,
          transitionDelay: '440ms',
        }}>
          <p style={{ fontSize: 14, color: '#C8C6C1', marginBottom: 8 }}>
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p style={{ fontSize: 13, color: '#666662' }}>
            Join 200+ restaurants already on AutoPilot
          </p>
        </div>

      </main>

      <Footer />
    </div>
  )
}
