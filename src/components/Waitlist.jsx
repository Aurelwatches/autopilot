import { useState } from 'react'

const C = {
  primary:   '#F0EEE9',
  secondary: '#888780',
  muted:     '#3A3835',
  card:      '#141414',
  border:    '#2A2A2A',
}

export default function Waitlist() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | success | error

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@') || !email.includes('.')) {
      setStatus('error')
      return
    }
    try {
      const existing = JSON.parse(localStorage.getItem('autopilot_waitlist') || '[]')
      if (!existing.includes(email)) {
        existing.push(email)
        localStorage.setItem('autopilot_waitlist', JSON.stringify(existing))
      }
    } catch (_) {}
    setStatus('success')
    setEmail('')
  }

  return (
    <section
      id="waitlist"
      className="py-24 md:py-32 px-6"
      style={{ borderTop: '1px solid #1E1E1E' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="max-w-lg">
          <p className="text-xs font-medium uppercase tracking-widest mb-10" style={{ color: C.secondary }}>
            Early access
          </p>

          <h2
            className="text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.05] mb-4"
            style={{ color: C.primary }}
          >
            Get in early.
          </h2>
          <p className="text-base mb-10 leading-relaxed" style={{ color: C.secondary }}>
            We're onboarding a limited number of restaurants this quarter.
            Join the list — we'll reach out when your spot is ready.
          </p>

          {status === 'success' ? (
            <div
              className="rounded-lg px-6 py-5"
              style={{ border: `1px solid ${C.border}`, backgroundColor: C.card }}
            >
              <p className="font-semibold mb-1" style={{ color: C.primary }}>
                You're on the list.
              </p>
              <p className="text-sm" style={{ color: C.secondary }}>
                We'll be in touch when your spot opens up.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setStatus('idle')
                  }}
                  placeholder="you@restaurant.com"
                  className="flex-1 min-w-0 text-sm px-4 py-2.5 rounded outline-none transition-colors"
                  style={{
                    backgroundColor: C.card,
                    color: C.primary,
                    border: `1px solid ${status === 'error' ? 'rgba(239,68,68,0.6)' : C.border}`,
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = C.secondary}
                  onBlur={e => e.currentTarget.style.borderColor = status === 'error' ? 'rgba(239,68,68,0.6)' : C.border}
                />
                <button
                  type="submit"
                  className="text-sm font-semibold px-5 py-2.5 rounded transition-colors shrink-0"
                  style={{ backgroundColor: '#F0EEE9', color: '#0A0A0A' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e4e2dd'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F0EEE9'}
                >
                  Join waitlist
                </button>
              </form>
              {status === 'error' && (
                <p className="text-xs mt-2" style={{ color: 'rgb(248,113,113)' }}>
                  Enter a valid email address.
                </p>
              )}
              <p className="text-xs mt-4" style={{ color: C.muted }}>
                No spam. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
