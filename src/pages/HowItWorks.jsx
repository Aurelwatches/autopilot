import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { EASE, Reveal, ShimmerButton, FloatingOrbs } from '../components/motion'

const C = {
  primary:   '#EAF2FF',
  secondary: '#94A3B8',
  muted:     '#6E7A8F',
  accent:    '#22D3EE',
}

const steps = [
  {
    number: '01',
    title: 'Sign up',
    body: 'Create your account in 2 minutes. No credit card, no setup calls — just your email and you’re in.',
  },
  {
    number: '02',
    title: 'We connect your Google',
    body: 'AutoPilot links securely to your Google Business Profile and learns your restaurant’s voice and history.',
  },
  {
    number: '03',
    title: 'Sit back',
    body: 'AI handles replies, posts, and customer follow-ups automatically — while you focus on your guests.',
  },
]

function Step({ step, index }) {
  const fromLeft = index % 2 === 0
  return (
    <motion.div
      initial={{ opacity: 0, x: fromLeft ? -70 : 70 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.75, ease: EASE }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(20px, 5vw, 56px)',
        flexDirection: fromLeft ? 'row' : 'row-reverse',
      }}
    >
      {/* Large step number */}
      <div style={{
        flexShrink: 0,
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: 'clamp(80px, 16vw, 180px)',
        fontWeight: 800,
        lineHeight: 0.85,
        letterSpacing: '-0.05em',
        background: 'linear-gradient(180deg, rgba(34,211,238,0.9), rgba(34,211,238,0.12))',
        WebkitBackgroundClip: 'text', backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {step.number}
      </div>

      {/* Text */}
      <div style={{ textAlign: fromLeft ? 'left' : 'right' }}>
        <h2 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 800,
          letterSpacing: '-0.02em', color: C.primary, margin: '0 0 14px',
        }}>
          {step.title}
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.65, color: C.secondary, maxWidth: 460, margin: fromLeft ? 0 : '0 0 0 auto' }}>
          {step.body}
        </p>
      </div>
    </motion.div>
  )
}

export default function HowItWorks() {
  return (
    <div className="min-h-screen ap-animated-gradient" style={{ position: 'relative', color: C.primary, overflow: 'hidden' }}>
      {/* Ambient background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <FloatingOrbs orbs={[
          {
            size: 620, position: { top: '4%', left: '-8%' },
            background: 'radial-gradient(circle at 40% 40%, #0B3A6B 0%, transparent 68%)',
            opacity: 0.4, blur: 70, duration: 30, x: [0, 50, -20, 0], y: [0, 40, 20, 0],
          },
          {
            size: 560, position: { bottom: '6%', right: '-6%' },
            background: 'radial-gradient(circle at 55% 45%, #073B46 0%, transparent 68%)',
            opacity: 0.34, blur: 70, duration: 36, x: [0, -50, 20, 0], y: [0, -40, 25, 0],
          },
        ]} />
        <div className="ap-grid-overlay" />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />

        <main style={{ maxWidth: 980, margin: '0 auto', padding: '150px 24px 110px' }}>
          {/* Header */}
          <Reveal amount={0.5} style={{ textAlign: 'center', marginBottom: 'clamp(64px, 10vw, 110px)' }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.18em', color: C.accent, marginBottom: 18,
            }}>
              How it works
            </p>
            <h1 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 800,
              letterSpacing: '-0.03em', color: '#FFFFFF', margin: '0 0 18px', lineHeight: 1.0,
            }}>
              Live in three steps.
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.55, color: C.secondary, maxWidth: 520, margin: '0 auto' }}>
              From sign-up to fully automated in minutes. Here’s the whole journey.
            </p>
          </Reveal>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(56px, 9vw, 100px)' }}>
            {steps.map((step, i) => (
              <Step key={step.number} step={step} index={i} />
            ))}
          </div>

          {/* CTA */}
          <Reveal amount={0.5} y={30} style={{ textAlign: 'center', marginTop: 'clamp(72px, 11vw, 120px)' }}>
            <h3 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800,
              letterSpacing: '-0.02em', color: C.primary, margin: '0 0 24px',
            }}>
              Ready to put it on autopilot?
            </h3>
            <ShimmerButton
              to="/signup"
              style={{
                background: '#22D3EE', color: '#04141A', borderRadius: 980,
                padding: '14px 32px', fontSize: 17, fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 8px 30px rgba(34,211,238,0.4)',
              }}
            >
              Start free trial
            </ShimmerButton>
          </Reveal>
        </main>

        <Footer />
      </div>
    </div>
  )
}
