import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { smoothScrollTo } from '../utils/smoothScroll'
import { EASE, ShimmerButton } from './motion'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-50"
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
      style={{
        // Background darkens + border appears on scroll; blur ramps up too.
        backgroundColor: scrolled ? 'rgba(5,7,13,0.82)' : 'rgba(5,7,13,0.30)',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
        backdropFilter: `blur(${scrolled ? 18 : 8}px)`,
        WebkitBackdropFilter: `blur(${scrolled ? 18 : 8}px)`,
        transition: 'background-color 500ms ease, border-color 500ms ease, backdrop-filter 500ms ease',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5" style={{ color: '#EAF2FF' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
              stroke="#22D3EE"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-base font-bold tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>AutoPilot</span>
        </a>

        <div className="flex items-center gap-6">
          <Link
            to="/how-it-works"
            className="nav-underline text-sm transition-colors hidden sm:block"
            style={{ color: '#94A3B8' }}
            onMouseEnter={e => e.currentTarget.style.color = '#EAF2FF'}
            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
          >
            How it works
          </Link>
          <a
            href="#services"
            className="nav-underline text-sm transition-colors hidden sm:block"
            style={{ color: '#94A3B8' }}
            onClick={e => { e.preventDefault(); smoothScrollTo('services') }}
            onMouseEnter={e => e.currentTarget.style.color = '#EAF2FF'}
            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
          >
            Services
          </a>
          <a
            href="#faq"
            className="nav-underline text-sm transition-colors hidden sm:block"
            style={{ color: '#94A3B8' }}
            onClick={e => { e.preventDefault(); smoothScrollTo('faq') }}
            onMouseEnter={e => e.currentTarget.style.color = '#EAF2FF'}
            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
          >
            FAQ
          </a>
          <Link
            to="/pricing"
            className="nav-underline text-sm transition-colors hidden sm:block"
            style={{ color: '#94A3B8' }}
            onMouseEnter={e => e.currentTarget.style.color = '#EAF2FF'}
            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
          >
            Pricing
          </Link>
          <Link
            to="/login"
            className="text-sm px-4 py-1.5 rounded-lg transition-colors hidden sm:block"
            style={{ color: '#EAF2FF', border: '1px solid rgba(245,241,232,0.18)', backgroundColor: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,241,232,0.45)'; e.currentTarget.style.backgroundColor = 'rgba(245,241,232,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,241,232,0.18)'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Sign in
          </Link>
          <ShimmerButton
            to="/signup"
            className="text-sm font-semibold px-4 py-1.5 rounded-lg"
            style={{ backgroundColor: '#22D3EE', color: '#04141A', boxShadow: '0 4px 16px rgba(34,211,238,0.32)', textDecoration: 'none' }}
          >
            Sign up
          </ShimmerButton>
        </div>
      </div>
    </motion.nav>
  )
}
