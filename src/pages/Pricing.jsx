import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../lib/auth'
import { EASE as MEASE, Stagger, StaggerItem, GlowCard, ShimmerButton, FloatingOrbs } from '../components/motion'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 3 }}>
      <path d="M3 8.5L6 11.5L13 4.5" stroke="#22D3EE" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 4 }}>
      <rect x="3" y="7.5" width="10" height="7.5" rx="1.5" stroke="#6E7A8F" strokeWidth="1.5" />
      <path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" stroke="#6E7A8F" strokeWidth="1.5"
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
    border: 'rgba(255,255,255,0.09)',
    shadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
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
    badge: { text: 'Most Popular', color: '#22D3EE', bg: 'rgba(34,211,238,0.14)', border: 'rgba(34,211,238,0.3)' },
    border: 'rgba(34,211,238,0.38)',
    shadow: '0 0 56px rgba(34,211,238,0.16), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
    featured: true,
    buttonStyle: 'amber',
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
    badge: { text: 'Best Value', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.28)' },
    border: 'rgba(59,130,246,0.3)',
    shadow: '0 0 48px rgba(59,130,246,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
    featured: false,
    buttonStyle: 'gold',
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

function PlanCard({ plan, yearly }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const price  = yearly ? plan.yearly : plan.monthly
  const period = yearly ? 'yr' : 'mo'

  function handleSelect() {
    localStorage.setItem('ap_selected_plan', plan.id)
    localStorage.setItem('ap_selected_interval', yearly ? 'yearly' : 'monthly')
    const destination = user ? '/checkout' : '/login'
    console.log('[AutoPilot] Plan selected:', {
      plan: plan.id,
      interval: yearly ? 'yearly' : 'monthly',
      loggedIn: !!user,
      redirectingTo: destination,
    })
    if (user) {
      navigate('/checkout')
    } else {
      navigate('/signup', { state: { message: 'Create an account to continue with your plan' } })
    }
  }

  const btnBase = {
    display: 'block', width: '100%', textAlign: 'center',
    borderRadius: 980, padding: '13px 0',
    fontSize: 15, fontWeight: 700, textDecoration: 'none',
    border: 'none', cursor: 'pointer',
  }
  const btnStyles = {
    outlined: { ...btnBase, backgroundColor: 'transparent', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.16)' },
    amber:    { ...btnBase, backgroundColor: '#22D3EE', color: '#04141A', boxShadow: '0 8px 30px rgba(34,211,238,0.45)' },
    gold:     { ...btnBase, backgroundColor: '#3B82F6', color: '#04141A', boxShadow: '0 8px 28px rgba(59,130,246,0.3)' },
  }

  return (
    <StaggerItem
      className={plan.id === 'growth' ? 'order-first md:order-none' : ''}
      style={{ display: 'flex' }}
    >
    <GlowCard
      glow={plan.featured ? 'amber' : 'cyan'}
      className={plan.featured ? 'ap-glow-border' : ''}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${plan.border}`,
        borderRadius: 24,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: plan.shadow,
        padding: plan.featured ? '36px 32px 32px' : '32px 28px 28px',
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
      <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 19, fontWeight: 700, color: '#EAF2FF', marginBottom: 6 }}>
        {plan.label}
      </p>
      <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24, lineHeight: 1.5 }}>
        {plan.subtitle}
      </p>

      {/* Animated price block */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 56, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.03em', color: '#FFFFFF' }}>
            ${price.toLocaleString()}
          </span>
          <span style={{ fontSize: 15, color: '#94A3B8', marginBottom: 8 }}>/{period}</span>
        </div>

        {yearly && plan.yearlySavings ? (
          <p style={{ fontSize: 13, color: '#22D3EE', fontWeight: 600 }}>
            Save ${plan.yearlySavings} · 2 months free
          </p>
        ) : (
          <p style={{ fontSize: 13, color: '#94A3B8' }}>
            {yearly ? 'Billed annually' : 'Billed monthly'}
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20 }} />

      {/* Features */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, marginBottom: 28 }}>
        {plan.features.map((f) => (
          <li key={f.text} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '5px 0', fontSize: 14,
            color: f.locked ? '#6E7A8F' : '#DCE6F5',
          }}>
            {f.locked ? <LockIcon /> : <CheckIcon />}
            <span>
              {f.text}
              {f.note && (
                <span style={{
                  fontSize: 10, color: '#94A3B8', marginLeft: 7,
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
      <ShimmerButton
        onClick={handleSelect}
        style={btnStyles[plan.buttonStyle]}
      >
        {plan.buttonText}
      </ShimmerButton>

      {/* Social proof */}
      {plan.socialProof && (
        <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          {plan.socialProof}
        </p>
      )}
    </GlowCard>
    </StaggerItem>
  )
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false)

  function switchPlan(toYearly) {
    if (toYearly === yearly) return
    setYearly(toYearly)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#05070D', color: '#EAF2FF' }}>
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

        {/* Drifting + rotating gradient orbs */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <FloatingOrbs orbs={[
            {
              size: 720,
              position: { top: '0%', left: '25%' },
              background: 'radial-gradient(circle at 38% 38%, #0B3A6B 0%, transparent 70%)',
              opacity: 0.3, blur: 70, duration: 28,
              x: [0, 60, -25, 0], y: [0, 45, 20, 0],
            },
            {
              size: 640,
              position: { bottom: '0%', right: '15%' },
              background: 'radial-gradient(circle at 58% 42%, #073B46 0%, transparent 70%)',
              opacity: 0.28, blur: 70, duration: 34,
              x: [0, -55, 25, 0], y: [0, -40, 25, 0],
            },
          ]} />
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: MEASE }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
        >
          <h1 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 'clamp(30px, 5vw, 52px)',
            fontWeight: 800, letterSpacing: '-0.03em',
            color: '#FFFFFF', margin: '0 0 12px',
          }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: 17, color: '#94A3B8', margin: 0 }}>
            Start free. Scale when you're ready.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: MEASE, delay: 0.1 }}
          style={{
            position: 'relative', zIndex: 1,
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 980, padding: 4,
          }}
        >
          <button
            onClick={() => switchPlan(false)}
            style={{
              padding: '7px 22px', borderRadius: 980,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: !yearly ? '#22D3EE' : 'transparent',
              color: !yearly ? '#04141A' : '#94A3B8',
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
              fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: yearly ? '#22D3EE' : 'transparent',
              color: yearly ? '#04141A' : '#94A3B8',
              transition: `background 200ms ${EASE}, color 200ms ${EASE}`,
            }}
          >
            Yearly
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 7px',
              borderRadius: 980, lineHeight: 1.4, whiteSpace: 'nowrap',
              background: yearly ? 'rgba(4,20,26,0.18)' : 'rgba(34,211,238,0.16)',
              color: yearly ? '#04141A' : '#22D3EE',
            }}>
              2 months free
            </span>
          </button>
        </motion.div>

        {/* Cards grid — staggered slide-up; Growth is first on mobile via CSS order */}
        <Stagger
          stagger={0.12}
          delayChildren={0.15}
          amount={0.2}
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 items-start"
          style={{ maxWidth: 1060, position: 'relative', zIndex: 1 }}
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              yearly={yearly}
            />
          ))}
        </Stagger>

        {/* Footer trust lines */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: MEASE, delay: 0.5 }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
        >
          <p style={{ fontSize: 14, color: '#CBD5E1', marginBottom: 8 }}>
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p style={{ fontSize: 13, color: '#6E7A8F' }}>
            Built for independent restaurants
          </p>
        </motion.div>

      </main>

      <Footer />
    </div>
  )
}
