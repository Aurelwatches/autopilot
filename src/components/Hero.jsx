import { motion, useReducedMotion, useScroll, useTransform, useSpring } from 'framer-motion'
import { smoothScrollTo } from '../utils/smoothScroll'
import {
  EASE, ShimmerButton, Particles, useTypewriter,
} from './motion'
import WaveDivider from './WaveDivider'
import ElegantShapes from './ElegantShapes'

const HEAD = 'Your restaurant\nruns itself.'
const GRAD_START = HEAD.indexOf('itself.')

function withBreaks(str) {
  const parts = str.split('\n')
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && <br />}
    </span>
  ))
}

// ── Large brand mark for right column ────────────────────────────────────────
function BrandMark() {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Soft glow behind icon */}
      <div style={{
        position: 'absolute',
        width: 340, height: 340,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Plane facing upward */}
      <div style={{ transform: 'rotate(-45deg)' }}>
        <svg width="180" height="180" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path
            d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
            stroke="#22D3EE"
            strokeWidth="0.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

// ── Glass notification card ──────────────────────────────────────────────────
function Card({ style, children }) {
  return (
    <div style={{
      position: 'relative',
      background: 'rgba(255,255,255,0.88)',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 20,
      padding: '12px 18px',
      fontSize: 13,
      color: '#0A0A0A',
      whiteSpace: 'nowrap',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function FloatingCard({ delay, bob, position, children }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      style={{ position: 'absolute', ...position }}
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      <Card style={reduce ? undefined : { animation: `cardBob ${bob}s ease-in-out infinite` }}>
        {children}
      </Card>
    </motion.div>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────
export default function Hero() {
  const { typed, done } = useTypewriter(HEAD, { speed: 52, startDelay: 350 })
  const shown = HEAD.slice(0, typed)
  const plain = shown.slice(0, Math.min(typed, GRAD_START))
  const grad  = typed > GRAD_START ? shown.slice(GRAD_START) : ''

  const { scrollY } = useScroll()
  const logoYRaw = useTransform(scrollY, [0, 400], [0, -180])
  const logoY = useSpring(logoYRaw, { stiffness: 80, damping: 25, mass: 0.5 })

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      paddingTop: 100,
      paddingBottom: 80,
    }}>

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 55% at 70% 40%, rgba(34,211,238,0.07) 0%, transparent 70%)',
      }} />

      {/* Elegant floating shapes */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <ElegantShapes />
      </div>

      {/* Subtle particle field */}
      <Particles count={12} color="rgba(34,211,238,0.3)" />

      {/* Grid overlay */}
      <div className="ap-grid-overlay" style={{ zIndex: 0 }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 0%, transparent 64%, rgba(255,255,255,0.95) 100%)',
      }} />

      <WaveDivider />

      {/* Two-column layout */}
      <div className="hero-grid" style={{
        position: 'relative', zIndex: 2,
        maxWidth: 1120, margin: '0 auto', width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 48,
        alignItems: 'center',
        paddingLeft: 40,
        paddingRight: 40,
      }}>

        {/* Left — text */}
        <div>
          <h1 className="hero-headline" style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 'clamp(42px, 6vw, 80px)',
            fontWeight: 800,
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            color: '#0A0A0A',
            marginBottom: 28,
            textAlign: 'left',
          }}>
            {withBreaks(plain)}
            {grad && <span className="ap-flow-text">{grad}</span>}
            {!done && <span className="ap-caret" style={{ background: '#22D3EE' }} />}
          </h1>

          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 1.0 }}
            style={{
              fontSize: 18, lineHeight: 1.65, color: '#6B7280',
              maxWidth: 420, marginBottom: 40, textAlign: 'left',
            }}
          >
            Your reviews get answered in your voice, every day — without you having to think about it.
          </motion.p>

          <motion.div
            className="hero-btns"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 1.35 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'flex-start', flexWrap: 'wrap' }}
          >
            <ShimmerButton
              to="/signup"
              className="hero-btn"
              style={{
                backgroundColor: '#22D3EE', color: '#04141A', borderRadius: 980,
                padding: '13px 30px', fontSize: 16, fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 8px 30px rgba(34,211,238,0.30)',
              }}
            >
              Start free trial
            </ShimmerButton>
            <ShimmerButton
              to="/how-it-works"
              className="hero-btn"
              style={{
                background: 'transparent', color: '#0A0A0A',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: 980, padding: '13px 30px', fontSize: 16, fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              See how it works
            </ShimmerButton>
          </motion.div>

          {/* Trust signals below CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 1.6 }}
            style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 28, flexWrap: 'wrap' }}
          >
            {/* 14-day trial */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ fontSize: 13, color: '#6B7280' }}>14-day free trial</span>
            </div>

            <div style={{ width: 1, height: 16, backgroundColor: 'rgba(0,0,0,0.12)' }} />

            {/* Cancel anytime */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ fontSize: 13, color: '#6B7280' }}>Cancel anytime</span>
            </div>

            <div style={{ width: 1, height: 16, backgroundColor: 'rgba(0,0,0,0.12)' }} />

            {/* Built for restaurants */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ fontSize: 13, color: '#6B7280' }}>Built for restaurants</span>
            </div>
          </motion.div>
        </div>

        {/* Right — logo with scroll parallax (hidden on mobile) */}
        <motion.div
          className="hero-right-col"
          style={{ y: logoY, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 420 }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0 }}
        >
          <BrandMark />

          {/* Floating cards around the logo */}
          <FloatingCard delay={1.5} bob={4} position={{ top: '8%', left: '-10%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22D3EE', flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>Review replied</span>
              <span style={{ color: '#6B7280' }}>· 2s ago</span>
            </div>
          </FloatingCard>

          <FloatingCard delay={1.65} bob={5} position={{ top: '14%', right: '-8%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ color: '#22D3EE', fontSize: 14, lineHeight: 1 }}>✓</span>
              <span style={{ fontWeight: 500 }}>Reply posted</span>
              <span style={{ color: '#6B7280' }}>in your voice</span>
            </div>
          </FloatingCard>

          <FloatingCard delay={1.8} bob={6} position={{ bottom: '10%', left: '5%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22D3EE', flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>AutoPilot is running</span>
              <span style={{ color: '#6B7280' }}>· 47 tasks today</span>
            </div>
          </FloatingCard>
        </motion.div>

      </div>
    </section>
  )
}
