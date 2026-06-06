import { useInView } from '../utils/useInView'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const C = {
  primary:   '#F0EEE9',
  secondary: '#888888',
  muted:     '#555555',
}

/* ─── Slide-in wrapper ──────────────────────────────────────────────────────── */
/* dir: 'left' | 'right' — controls the start offset direction.                   */

function Slide({ show, dir, delay = 0, children, style }) {
  const offset = dir === 'left' ? '-60px' : '60px'
  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateX(0)' : `translateX(${offset})`,
        transition: `opacity 700ms ${EASE}, transform 700ms ${EASE}`,
        transitionDelay: `${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Dark glass mockup shell ───────────────────────────────────────────────── */

function Glass({ children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      {children}
    </div>
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
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
            Live
          </span>
        }
      />
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: C.primary }}>Sarah M.</span>
          <span style={{ fontSize: 12, color: '#FFB400' }}>★★★★★</span>
          <span style={{ fontSize: 12, color: C.muted }}>· 2h ago</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: C.secondary }}>
          "Best tacos in the city. The service was incredible — our server remembered
          my usual order. Will absolutely be back."
        </p>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} />
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

function SocialMockup() {
  const posts = [
    { platform: 'Instagram', time: 'Today, 11:30 AM', copy: 'Taco Tuesday is back — 3 for $12, today only.', status: 'scheduled' },
    { platform: 'Facebook',  time: 'Wed, 6:00 PM',    copy: 'New happy hour menu just dropped. Come see us.',  status: 'draft' },
    { platform: 'Instagram', time: 'Fri, 12:00 PM',   copy: 'Weekend special: buy 2 get 1 free on mains.',     status: 'scheduled' },
  ]
  return (
    <Glass>
      <GlassHeader
        label="Scheduled Posts"
        right={<span style={{ fontSize: 12, color: C.muted }}>3 queued</span>}
      />
      <div>
        {posts.map((post, i) => (
          <div
            key={i}
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              borderBottom: i < posts.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.primary }}>{post.platform}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{post.time}</span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: C.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {post.copy}
              </p>
            </div>
            <span style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              flexShrink: 0,
              ...(post.status === 'scheduled'
                ? { background: 'rgba(34,197,94,0.12)', color: '#4ade80' }
                : { background: 'rgba(255,255,255,0.06)', color: C.secondary }),
            }}>
              {post.status}
            </span>
          </div>
        ))}
      </div>
    </Glass>
  )
}

function TextMessageMockup() {
  return (
    <Glass>
      <GlassHeader
        label="Follow-up text"
        right={<span style={{ fontSize: 12, color: C.muted }}>Delivered</span>}
      />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Outgoing AutoPilot message */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            maxWidth: '80%',
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            color: '#FFFFFF',
            fontSize: 13,
            lineHeight: 1.5,
            padding: '10px 14px',
            borderRadius: '16px 16px 4px 16px',
          }}>
            Hi Marcus! It's been a while — here's 15% off your next visit. We saved your
            usual table. 🌮
          </div>
        </div>

        {/* Incoming customer reply */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{
            maxWidth: '80%',
            background: 'rgba(255,255,255,0.06)',
            color: C.primary,
            fontSize: 13,
            lineHeight: 1.5,
            padding: '10px 14px',
            borderRadius: '16px 16px 16px 4px',
          }}>
            Perfect timing — booking for Friday night!
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: C.muted }}>Booked a table · 12 min later</span>
        </div>
      </div>
    </Glass>
  )
}

/* ─── Feature section data ──────────────────────────────────────────────────── */

const sections = [
  {
    number: '01',
    heading: 'Every review. Answered automatically.',
    body: 'AutoPilot watches your Google listing around the clock. Every new review gets a thoughtful, on-brand reply within minutes — without you writing a single word.',
    mockup: <ReviewMockup />,
    textSide: 'left',  // text left, mockup right
    stagger: false,
  },
  {
    number: '02',
    heading: 'Show up in the feed. Without lifting a finger.',
    body: 'Daily specials, seasonal promotions, events — AutoPilot drafts and schedules content for Instagram and Facebook. Your followers see you. You focus on your guests.',
    mockup: <SocialMockup />,
    textSide: 'right', // text right, mockup left
    stagger: true,
  },
  {
    number: '03',
    heading: 'Bring them back.',
    body: 'Automated follow-up texts reach past guests with offers they\'ll actually use — sent at exactly the right moment. One-time visitors quietly become regulars.',
    mockup: <TextMessageMockup />,
    textSide: 'left',
    stagger: false,
  },
]

/* ─── Single feature section ────────────────────────────────────────────────── */

function FeatureSection({ section }) {
  const [ref, inView] = useInView({ threshold: 0.2 })
  const textLeft = section.textSide === 'left'

  // Text slides from its own side; mockup from the opposite side.
  const textDir   = textLeft ? 'left' : 'right'
  const mockupDir = textLeft ? 'right' : 'left'

  // Stagger only section 2 (mockup 150ms after text).
  const mockupDelay = section.stagger ? 150 : 0

  // DOM order is always text-first (good mobile reading order); on desktop the
  // grid flips columns for textSide === 'right' via the --flip modifier.
  const text = (
    <Slide show={inView} dir={textDir}>
      <span style={{ fontSize: 12, fontFamily: 'monospace', letterSpacing: '0.2em', color: C.muted }}>
        {section.number}
      </span>
      <h3 style={{
        fontSize: 'clamp(28px, 4vw, 40px)',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        color: C.primary,
        margin: '16px 0 20px',
      }}>
        {section.heading}
      </h3>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: C.secondary, maxWidth: 460 }}>
        {section.body}
      </p>
    </Slide>
  )

  const mockup = (
    <Slide show={inView} dir={mockupDir} delay={mockupDelay}>
      {section.mockup}
    </Slide>
  )

  return (
    <div ref={ref} className={`feature-grid${textLeft ? '' : ' feature-grid--flip'}`}>
      {text}
      {mockup}
    </div>
  )
}

/* ─── Features ──────────────────────────────────────────────────────────────── */

export default function Features() {
  return (
    <section id="features" style={{ backgroundColor: '#000000' }}>
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
