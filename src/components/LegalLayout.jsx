import { useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

const C = { bg: '#0A0A0A', primary: '#F0EEE9', secondary: '#888780', muted: '#3A3835', border: '#2A2A2A' }

// Shared chrome for /privacy and /terms.
export default function LegalLayout({ title, updated, children }) {
  // Legal pages should start at the top, not wherever the landing page was scrolled.
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', color: C.primary }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-3xl font-semibold mb-2" style={{ color: C.primary }}>{title}</h1>
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
