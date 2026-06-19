import { Reveal, Stagger, StaggerItem, GlowCard } from './motion'

const C = {
  primary:   '#0A0A0A',
  secondary: '#6B7280',
  accent:    '#22D3EE',
}

function IconChip({ children }) {
  return (
    <div style={{
      width: 46, height: 46, borderRadius: 13,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(34,211,238,0.12)',
      border: '1px solid rgba(34,211,238,0.28)',
      color: C.accent, marginBottom: 20,
    }}>
      {children}
    </div>
  )
}

const ReviewIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)
const SocialIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)
const AnalyticsIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const services = [
  { icon: ReviewIcon, title: 'Review Management', body: 'AI replies to every Google review. Thoughtful, on-brand, and within minutes, day or night.' },
  { icon: SocialIcon, title: 'Social Media', body: 'Auto-generated posts for Instagram and Facebook, drafted and scheduled so you stay in the feed.' },
  { icon: AnalyticsIcon, title: 'Analytics Dashboard', body: 'Track your reviews, posts, and customer sentiment in real time from one clean dashboard.' },
]

export default function Services() {
  return (
    <section id="services" style={{ position: 'relative', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <Reveal amount={0.4} style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{
            fontSize: 13, fontWeight: 500,
            color: C.accent, marginBottom: 16,
          }}>
            What AutoPilot does
          </p>
          <h2 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 'clamp(32px, 5vw, 50px)', fontWeight: 800,
            letterSpacing: '-0.03em', color: C.primary, margin: 0,
          }}>
            Everything, automated.
          </h2>
        </Reveal>

        <Stagger
          stagger={0.12}
          amount={0.2}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {services.map((s) => (
            <StaggerItem key={s.title} style={{ display: 'flex' }}>
              <GlowCard
                glow="cyan"
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 22,
                  boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                  padding: 28,
                }}
              >
                <IconChip>{s.icon}</IconChip>
                <h3 style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 21, fontWeight: 700, color: C.primary, marginBottom: 10,
                }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: C.secondary, margin: 0 }}>
                  {s.body}
                </p>
              </GlowCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
