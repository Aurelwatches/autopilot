const C = {
  primary:   '#F0EEE9',
  secondary: '#888780',
  muted:     '#3A3835',
}

export default function Footer() {
  return (
    <footer className="py-10 px-6" style={{ borderTop: '1px solid #1E1E1E' }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <a href="/" className="flex items-center gap-2.5" style={{ color: C.primary }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm font-semibold tracking-tight">AutoPilot</span>
        </a>

        <p className="text-xs order-last sm:order-none" style={{ color: C.muted }}>
          &copy; {new Date().getFullYear()} AutoPilot Inc. All rights reserved.
        </p>

        <div className="flex gap-6">
          {[{ label: 'Privacy', to: '/privacy' }, { label: 'Terms', to: '/terms' }].map(({ label, to }) => (
            <a
              key={label}
              href={to}
              className="text-xs transition-colors"
              style={{ color: C.secondary }}
              onMouseEnter={e => e.target.style.color = C.primary}
              onMouseLeave={e => e.target.style.color = C.secondary}
            >
              {label}
            </a>
          ))}
          <a
            href="mailto:hello@useautopilot.com"
            className="text-xs transition-colors"
            style={{ color: C.secondary }}
            onMouseEnter={e => e.target.style.color = C.primary}
            onMouseLeave={e => e.target.style.color = C.secondary}
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}
