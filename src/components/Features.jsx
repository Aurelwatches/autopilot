import { motion } from 'framer-motion'
import { EASE, GlowCard, Stagger, StaggerItem } from './motion'

const C = {
  primary:   '#0A0A0A',
  secondary: '#6B7280',
  muted:     '#9CA3AF',
  accent:    '#22D3EE',
  success:   '#22D3EE',
}

/* ─── Slide-in wrapper (scroll-triggered) ───────────────────────────────────── */
/* dir: 'left' | 'right' — controls the start offset direction.                   */

function SlideIn({ dir, delay = 0, amount = 0.3, children, style }) {
  const offset = dir === 'left' ? -60 : 60
  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, x: offset }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Dark glass mockup shell (lifts + glows on hover) ───────────────────────── */

function Glass({ children }) {
  return (
    <GlowCard
      glow="cyan"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 20,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      {children}
    </GlowCard>
  )
}

function GlassHeader({ label, right }) {
  return (
    <div style={{
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.secondary }}>
        {label}
      </span>
      {right}
    </div>
  )
}

/* ─── Mockups ───────────────────────────────────────────────────────────────── */

function ReviewMockup() {
  return (
    <Glass>
      <GlassHeader
        label="Google Reviews"
        right={
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.success, display: 'inline-block' }} />
            Live
          </span>
        }
      />
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: C.primary }}>Sarah M.</span>
          <span style={{ fontSize: 12, color: '#FBBF24' }}>★★★★★</span>
          <span style={{ fontSize: 12, color: C.muted }}>· 2h ago</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: C.secondary }}>
          "Best tacos in the city. The service was incredible. Our server remembered
          my usual order. Will absolutely be back."
        </p>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: C.secondary }}>AutoPilot replied · 4 min ago</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: C.primary }}>
          "Thank you so much, Sarah! We're so glad you had another great experience
          with us. Can't wait to see you again soon!"
        </p>
      </div>
    </Glass>
  )
}

function ReplyQueueMockup() {
  const items = [
    { name: 'James T.', stars: 5, preview: 'Best tacos in the city, will definitely be back!', status: 'replied' },
    { name: 'Maria L.', stars: 2, preview: 'Service was slow and the order came out wrong…',   status: 'pending' },
    { name: 'David K.', stars: 4, preview: 'Great food, parking was a bit tough to find.',      status: 'replied' },
  ]
  return (
    <Glass>
      <GlassHeader
        label="Review Queue"
        right={<span style={{ fontSize: 12, color: C.muted }}>3 reviews</span>}
      />
      <Stagger stagger={0.14} amount={0.4}>
        {items.map((item, i) => (
          <StaggerItem
            key={i}
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.primary }}>{item.name}</span>
                <span style={{ fontSize: 11, color: '#F59E0B', letterSpacing: 1 }}>{'★'.repeat(item.stars)}</span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: C.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.preview}
              </p>
            </div>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 6, flexShrink: 0,
              ...(item.status === 'replied'
                ? { background: 'rgba(16,185,129,0.14)', color: '#34D399' }
                : { background: 'rgba(34,211,238,0.14)', color: '#67E8F9' }),
            }}>
              {item.status}
            </span>
          </StaggerItem>
        ))}
      </Stagger>
    </Glass>
  )
}

/* ─── Feature section data ──────────────────────────────────────────────────── */

const sections = [
  {
    number: '01',
    heading: 'Every review. Answered automatically.',
    body: 'AutoPilot watches your Google listing around the clock. Every new review gets a thoughtful, on-brand reply — sent during your business hours so it looks natural, never 3 am.',
    mockup: <ReviewMockup />,
    textSide: 'left',
    stagger: false,
  },
  {
    number: '02',
    heading: 'Your full reply history, in one place.',
    body: 'See every review, its star rating, and whether AutoPilot has replied — all from a single dashboard. Filter by pending, replied, or low-star reviews in seconds.',
    mockup: <ReplyQueueMockup />,
    textSide: 'right',
    stagger: true,
  },
]

/* ─── Single feature section ────────────────────────────────────────────────── */

function FeatureSection({ section }) {
  const textLeft = section.textSide === 'left'

  // Text slides from its own side; mockup from the opposite side.
  const textDir   = textLeft ? 'left' : 'right'
  const mockupDir = textLeft ? 'right' : 'left'

  // Stagger only section 2 (mockup 150ms after text).
  const mockupDelay = section.stagger ? 0.15 : 0

  // DOM order is always text-first (good mobile reading order); on desktop the
  // grid flips columns for textSide === 'right' via the --flip modifier.
  const text = (
    <SlideIn dir={textDir}>
      <h3 style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: 'clamp(28px, 4vw, 42px)',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.08,
        color: C.primary,
        margin: '16px 0 20px',
      }}>
        {section.heading}
      </h3>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: C.secondary, maxWidth: 460 }}>
        {section.body}
      </p>
    </SlideIn>
  )

  const mockup = (
    <SlideIn dir={mockupDir} delay={mockupDelay}>
      {section.mockup}
    </SlideIn>
  )

  return (
    <div className={`feature-grid${textLeft ? '' : ' feature-grid--flip'}`}>
      {text}
      {mockup}
    </div>
  )
}

/* ─── Features ──────────────────────────────────────────────────────────────── */

export default function Features() {
  return (
    <section id="features" style={{ position: 'relative' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 112 }}>
          {sections.map((s) => (
            <FeatureSection key={s.number} section={s} />
          ))}
        </div>
      </div>
    </section>
  )
}
