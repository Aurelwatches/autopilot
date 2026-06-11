import { motion, useReducedMotion } from 'framer-motion'
import { smoothScrollTo } from '../utils/smoothScroll'
import {
  EASE, ShimmerButton, Particles, useTypewriter,
} from './motion'
import WaveDivider from './WaveDivider'
import ElegantShapes from './ElegantShapes'

const HEAD = 'Your restaurant\nruns itself.'
const GRAD_START = HEAD.indexOf('itself.')

// Render a string with '\n' turned into <br/>.
function withBreaks(str) {
  const parts = str.split('\n')
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && <br />}
    </span>
  ))
}

// ── Glass notification card ──────────────────────────────────────────────────
function Card({ style, children }) {
  return (
    <div style={{
      position: 'relative',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 20,
      padding: '12px 18px',
      fontSize: 13,
      color: '#EAF2FF',
      whiteSpace: 'nowrap',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Floating mockup card: fades + slides up on load, then bobs forever ────────
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

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      paddingTop: 140,
      paddingBottom: 80,
      paddingLeft: 24,
      paddingRight: 24,
    }}>

      {/* Soft ambient glow — quiet depth behind the elegant shapes */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 55% at 50% 40%, rgba(11,58,107,0.45) 0%, transparent 70%)',
      }} />

      {/* Elegant floating 3D shapes (21st.dev) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <ElegantShapes />
      </div>

      {/* Subtle particle field */}
      <Particles count={16} color="rgba(34,211,238,0.4)" />

      {/* Subtle grid overlay */}
      <div className="ap-grid-overlay" style={{ zIndex: 0 }} />

      {/* Bottom fade — blobs dissolve toward the seam with the next section */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 0%, transparent 64%, rgba(5,7,13,0.82) 100%)',
      }} />

      {/* Flowing wave seam into the content below */}
      <WaveDivider />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 820 }}>

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.18em', color: '#22D3EE', marginBottom: 24,
          }}
        >
          AI automation for restaurants
        </motion.p>

        {/* Headline — types itself in */}
        <h1 className="hero-headline" style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 'clamp(48px, 9vw, 92px)',
          fontWeight: 800,
          lineHeight: 0.98,
          letterSpacing: '-0.03em',
          color: '#FFFFFF',
          marginBottom: 28,
          minHeight: '1.96em',
        }}>
          {withBreaks(plain)}
          {grad && <span className="ap-flow-text">{grad}</span>}
          {!done && <span className="ap-caret" style={{ background: '#22D3EE' }} />}
        </h1>

        {/* Glowing gradient line */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <motion.div
            className="ap-flow-line"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 1.0 }}
            style={{
              height: 3, width: 120, borderRadius: 2, transformOrigin: 'left center',
              boxShadow: '0 0 16px rgba(34,211,238,0.7)',
            }}
          />
        </div>

        {/* Subheadline */}
        <motion.p
          className="hero-sub"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 1.15 }}
          style={{
            fontSize: 19, lineHeight: 1.55, color: '#94A3B8',
            maxWidth: 500, margin: '0 auto 40px',
          }}
        >
          AutoPilot handles Google reviews, social posts, and customer
          follow-ups — automatically.
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="hero-btns"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 1.35 }}
          style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <ShimmerButton
            to="/signup"
            className="hero-btn"
            style={{
              backgroundColor: '#22D3EE', color: '#04141A', borderRadius: 980,
              padding: '13px 30px', fontSize: 17, fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 8px 30px rgba(34,211,238,0.4)',
            }}
          >
            Start free trial
          </ShimmerButton>
          <ShimmerButton
            to="/how-it-works"
            className="hero-btn"
            style={{
              background: 'rgba(255,255,255,0.05)', color: '#EAF2FF',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 980, padding: '13px 30px', fontSize: 17, fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            See how it works
          </ShimmerButton>
        </motion.div>
      </div>

      {/* Floating notification cards (the "dashboard mockup" pieces) */}
      <div className="hero-cards" style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>

        <FloatingCard delay={1.5} bob={4} position={{ top: '52%', left: 'max(28px, 7%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22D3EE', flexShrink: 0 }} />
            <span style={{ fontWeight: 500 }}>Review replied</span>
            <span style={{ color: '#94A3B8' }}>· 2s ago</span>
          </div>
        </FloatingCard>

        <FloatingCard delay={1.65} bob={5} position={{ top: '28%', right: 'max(28px, 7%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: '#22D3EE', fontSize: 14, lineHeight: 1 }}>★</span>
            <span style={{ fontWeight: 500 }}>4.9</span>
            <span style={{ color: '#94A3B8' }}>avg rating this month</span>
          </div>
        </FloatingCard>

        <FloatingCard delay={1.8} bob={6} position={{ bottom: 'calc(20% - 40px)', left: '50%', marginLeft: -130 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22D3EE', flexShrink: 0 }} />
            <span style={{ fontWeight: 500 }}>AutoPilot is running</span>
            <span style={{ color: '#94A3B8' }}>· 47 tasks today</span>
          </div>
        </FloatingCard>

      </div>
    </section>
  )
}
