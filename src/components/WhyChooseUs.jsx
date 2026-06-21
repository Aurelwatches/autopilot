import { Reveal, Stagger, StaggerItem, GlowCard } from './motion'

const C = {
  primary:   '#0A0A0A',
  secondary: '#6B7280',
  accent:    '#22D3EE',
}

const reasons = [
  { title: 'Built for restaurants', body: 'Not generic software bolted onto your business. AutoPilot is shaped around how restaurants actually run.' },
  { title: 'Set up in minutes', body: 'We handle the whole setup. Connect your Google profile and AutoPilot takes it from there.' },
  { title: 'Cancel anytime', body: 'Month to month, no commitments. If it stops working for you, cancel in one click — no hoops, no questions.' },
  { title: 'Real AI, real results', body: 'Trained on real restaurant conversations, so every reply sounds like you, not a robot.' },
]

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export default function WhyChooseUs() {
  return (
    <section id="why-us" style={{ position: 'relative', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Reveal amount={0.4} style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{
            fontSize: 13, fontWeight: 500,
            color: C.accent, marginBottom: 16,
          }}>
            Why AutoPilot
          </p>
          <h2 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 'clamp(32px, 5vw, 50px)', fontWeight: 800,
            letterSpacing: '-0.03em', color: C.primary, margin: 0,
          }}>
            Made for the way you work.
          </h2>
        </Reveal>

        <Stagger
          stagger={0.1}
          amount={0.2}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {reasons.map((r) => (
            <StaggerItem key={r.title} style={{ display: 'flex' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.28)',
                  }}>
                    <CheckIcon />
                  </div>
                  <h3 style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontSize: 20, fontWeight: 700, color: C.primary, margin: 0,
                  }}>
                    {r.title}
                  </h3>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: C.secondary, margin: 0 }}>
                  {r.body}
                </p>
              </GlowCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
