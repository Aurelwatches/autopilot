import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

const C = { bg: '#0B0A09', primary: '#F5F1E8', secondary: '#A39B8E', muted: '#6E665B', border: '#2E2A24' }

// Shared chrome for /privacy and /terms.
export default function LegalLayout({ title, updated, children }) {
  // Legal pages should start at the top, not wherever the landing page was scrolled.
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', color: C.primary }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.primary, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{title}</h1>
        <p className="text-xs mb-10" style={{ color: C.muted }}>Last updated: {updated}</p>
        <div className="legal-body">{children}</div>
      </main>
      <Footer />
    </div>
  )
}

// Section heading + body helpers so the two pages stay consistent.
export function LSection({ n, title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold mb-2" style={{ color: C.primary }}>
        {n}. {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: C.secondary }}>
        {children}
      </div>
    </section>
  )
}
