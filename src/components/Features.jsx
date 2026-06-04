import { useState } from 'react'

/* ─── Color tokens ──────────────────────────────────────────────────────────── */

const C = {
  primary:   '#F0EEE9',
  secondary: '#888780',
  muted:     '#3A3835',
  card:      '#141414',
  border:    '#2A2A2A',
  divider:   '#222220',
}

/* ─── Tilted + hoverable card wrapper ──────────────────────────────────────── */

function TiltedCard({ children, tilt }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '8px',
        transform: hovered
          ? `rotate(${tilt}deg) perspective(900px) rotateY(${tilt > 0 ? -5 : 5}deg)`
          : `rotate(${tilt}deg)`,
        boxShadow: hovered
          ? '0 40px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.45)'
          : '0 28px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3)',
        transition: 'transform 0.45s cubic-bezier(0.23,1,0.32,1), box-shadow 0.45s ease',
        willChange: 'transform',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Reflection highlight — thin bright line across the top edge */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.22) 50%, transparent 95%)',
          borderRadius: '8px 8px 0 0',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {children}
    </div>
  )
}

/* ─── UI mockup cards ───────────────────────────────────────────────────────── */

function ReviewCard() {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
    >
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${C.divider}` }}
      >
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: C.secondary }}>
          Google Reviews
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Live
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium" style={{ color: C.primary }}>Sarah M.</span>
            <span className="text-xs tracking-tight" style={{ color: C.primary }}>★★★★★</span>
            <span className="text-xs" style={{ color: C.muted }}>· 2h ago</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: C.secondary }}>
            "Best tacos in the city. The service was incredible — our server remembered
            my usual order. Will absolutely be back."
          </p>
        </div>

        <div className="h-px" style={{ backgroundColor: C.divider }} />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            <span className="text-xs" style={{ color: C.secondary }}>AutoPilot replied · 4 min ago</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: C.primary }}>
            "Thank you so much, Sarah! We're so glad you had another great experience
            with us. Can't wait to see you again soon!"
          </p>
        </div>
      </div>
    </div>
  )
}

function SocialCard() {
  const posts = [
    { platform: 'Instagram', time: 'Today, 11:30 AM', copy: 'Taco Tuesday is back — 3 for $12, today only.', status: 'scheduled' },
    { platform: 'Facebook',  time: 'Wed, 6:00 PM',    copy: 'New happy hour menu just dropped. Come see us.',  status: 'draft' },
    { platform: 'Instagram', time: 'Fri, 12:00 PM',   copy: 'Weekend special: buy 2 get 1 free on mains.',     status: 'scheduled' },
  ]

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
    >
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${C.divider}` }}
      >
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: C.secondary }}>
          Scheduled Posts
        </span>
        <span className="text-xs" style={{ color: C.muted }}>3 queued</span>
      </div>

      <div>
        {posts.map((post, i) => (
          <div
            key={i}
            className="px-5 py-4 flex items-start gap-3"
            style={i < posts.length - 1 ? { borderBottom: `1px solid ${C.divider}` } : {}}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium" style={{ color: C.primary }}>{post.platform}</span>
                <span className="text-xs" style={{ color: C.muted }}>{post.time}</span>
              </div>
              <p className="text-xs leading-relaxed line-clamp-1" style={{ color: C.secondary }}>
                {post.copy}
              </p>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded shrink-0"
              style={
                post.status === 'scheduled'
                  ? { backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80' }
                  : { backgroundColor: '#1E1E1E', color: C.secondary }
              }
            >
              {post.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FollowupCard() {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
    >
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${C.divider}` }}
      >
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: C.secondary }}>
          Campaign sent
        </span>
        <span className="text-xs" style={{ color: C.muted }}>Yesterday, 10 AM</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex gap-2 text-xs">
            <span className="w-14 shrink-0" style={{ color: C.muted }}>Audience</span>
            <span style={{ color: C.primary }}>Guests who visited 30+ days ago</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="w-14 shrink-0" style={{ color: C.muted }}>Subject</span>
            <span style={{ color: C.primary }}>We miss you — here's 15% off</span>
          </div>
        </div>

        <div className="h-px" style={{ backgroundColor: C.divider }} />

        <p className="text-sm leading-relaxed" style={{ color: C.secondary }}>
          "Hi [first name], it's been a while since your last visit. We'd love to have
          you back — here's 15% off your next meal, just for you."
        </p>

        <div className="h-px" style={{ backgroundColor: C.divider }} />

        <div className="grid grid-cols-3 gap-3 text-center pt-1">
          {[['247', 'Sent'], ['31%', 'Opened'], ['18%', 'Redeemed']].map(([val, label]) => (
            <div key={label}>
              <div className="text-xl font-semibold tracking-tight" style={{ color: C.primary }}>{val}</div>
              <div className="text-xs mt-0.5" style={{ color: C.muted }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Feature row data ──────────────────────────────────────────────────────── */

const features = [
  {
    number: '01',
    heading: 'Respond to every review. Automatically.',
    body: 'AutoPilot monitors your Google listing around the clock. Every new review gets a thoughtful, on-brand response within minutes — without you writing a single word.',
    card: <ReviewCard />,
    flip: false,
    tilt: 2,
  },
  {
    number: '02',
    heading: 'Show up in the feed. Without lifting a finger.',
    body: 'Daily specials, seasonal promotions, events — AutoPilot drafts and schedules content for Instagram and Facebook. Your followers see you. You focus on your guests.',
    card: <SocialCard />,
    flip: true,
    tilt: -2,
  },
  {
    number: '03',
    heading: 'Turn one-time guests into regulars.',
    body: "Automated follow-up campaigns reach past customers with offers they'll actually use. Birthday perks, loyalty rewards, re-engagement messages — sent at exactly the right moment.",
    card: <FollowupCard />,
    flip: false,
    tilt: 2,
  },
]

/* ─── Section ───────────────────────────────────────────────────────────────── */

export default function Features() {
  return (
    <section id="features" style={{ borderTop: '1px solid #1E1E1E' }}>
      <div className="max-w-6xl mx-auto px-6 py-24 space-y-24 md:space-y-32">
        {features.map((f) => (
          <div
            key={f.number}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
          >
            {/* Text */}
            <div className={f.flip ? 'lg:order-2' : ''}>
              <span className="text-xs font-mono tracking-widest" style={{ color: C.muted }}>
                {f.number}
              </span>
              <h3
                className="text-3xl md:text-4xl font-bold tracking-tight leading-[1.1] mt-4 mb-5"
                style={{ color: C.primary }}
              >
                {f.heading}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: C.secondary }}>
                {f.body}
              </p>
            </div>

            {/* Card — tilted and hoverable */}
            <div className={f.flip ? 'lg:order-1' : ''}>
              <TiltedCard tilt={f.tilt}>{f.card}</TiltedCard>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
