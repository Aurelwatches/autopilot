import { Reveal, ShimmerButton } from './motion'

const C = {
  primary:   '#EAF2FF',
  secondary: '#94A3B8',
  muted:     '#6E7A8F',
}

export default function Pricing() {
  return (
    <section
      id="pricing"
      style={{ position: 'relative', padding: '112px 24px', textAlign: 'center' }}
    >
      <Reveal amount={0.3} y={40} style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12, fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.18em', color: '#22D3EE', marginBottom: 20,
        }}>
          Pricing
        </p>

        <h2 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 'clamp(36px, 6vw, 56px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: C.primary,
          marginBottom: 24,
        }}>
          Simple pricing.
        </h2>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(56px, 9vw, 88px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: C.primary }}>
            $200
          </span>
          <span style={{ fontSize: 20, color: C.secondary, marginBottom: 12 }}>/ month</span>
        </div>

        <p style={{ fontSize: 18, lineHeight: 1.6, color: C.secondary, maxWidth: 420, margin: '0 auto 36px' }}>
          Everything you need to automate your restaurant.
        </p>

        <ShimmerButton
          to="/pricing"
          style={{
            gap: 8,
            background: '#22D3EE',
            color: '#04141A',
            borderRadius: 980,
            padding: '13px 30px',
            fontSize: 16,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(34,211,238,0.4)',
          }}
        >
          See full pricing →
        </ShimmerButton>
      </Reveal>
    </section>
  )
}
