import { smoothScrollTo } from '../utils/smoothScroll'

const C = {
  primary:   '#F0EEE9',
  secondary: '#888780',
  muted:     '#3A3835',
  card:      '#141414',
  border:    '#2A2A2A',
  divider:   '#222220',
}

const includes = [
  'Unlimited Google review replies',
  'Social media content & scheduling',
  'Automated customer follow-up campaigns',
  'Analytics and performance dashboard',
  'Dedicated onboarding and setup',
  'Email support',
]

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="py-24 md:py-32 px-6 text-center"
      style={{ borderTop: '1px solid #1E1E1E' }}
    >
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-widest mb-16" style={{ color: C.secondary }}>
          Pricing
        </p>

        {/* Centered card — floating */}
        <div
          className="mx-auto rounded-lg px-10 py-12"
          style={{
            maxWidth: '480px',
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            animation: 'cardFloat 4s ease-in-out infinite',
            boxShadow: '0 32px 72px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {/* Label above price */}
          <p className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: C.muted }}>
            One plan. No surprises.
          </p>

          {/* Price */}
          <div className="flex items-end justify-center gap-2 mb-2">
            <span
              className="font-bold leading-none tracking-[-0.05em]"
              style={{ fontSize: '96px', color: C.primary }}
            >
              $200
            </span>
            <span className="text-base mb-3" style={{ color: C.secondary }}>/&nbsp;mo</span>
          </div>

          <p className="text-sm mb-10" style={{ color: C.secondary }}>
            Less than one hour of labor. More than a full-time employee.
          </p>

          {/* Divider */}
          <div className="h-px mb-2" style={{ backgroundColor: C.divider }} />

          {/* Feature list with line separators */}
          <ul className="mb-2 text-left">
            {includes.map((item, i) => (
              <li
                key={item}
                className="py-3.5 text-sm"
                style={{
                  color: C.secondary,
                  borderBottom: i < includes.length - 1 ? `1px solid ${C.divider}` : 'none',
                }}
              >
                {item}
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="h-px mb-8" style={{ backgroundColor: C.divider }} />

          {/* Full-width button */}
          <a
            href="#waitlist"
            className="block w-full text-sm font-semibold py-3 rounded text-center transition-colors"
            style={{ backgroundColor: '#F0EEE9', color: '#0A0A0A' }}
            onClick={e => { e.preventDefault(); smoothScrollTo('waitlist') }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e4e2dd'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F0EEE9'}
          >
            Start free trial
          </a>

          <p className="text-xs mt-4" style={{ color: C.muted }}>
            14 days free — no credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}
