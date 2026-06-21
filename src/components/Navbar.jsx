import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { smoothScrollTo } from '../utils/smoothScroll'
import { EASE, ShimmerButton } from './motion'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close menu on route change / scroll
  useEffect(() => {
    if (menuOpen) setMenuOpen(false)
  }, [scrolled])

  return (
    <>
      <motion.nav
        className="fixed top-0 inset-x-0 z-50"
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        style={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.70)',
          borderBottom: `1px solid ${scrolled ? 'rgba(0,0,0,0.08)' : 'transparent'}`,
          backdropFilter: `blur(${scrolled ? 18 : 8}px)`,
          WebkitBackdropFilter: `blur(${scrolled ? 18 : 8}px)`,
          transition: 'background-color 500ms ease, border-color 500ms ease',
        }}
      >
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0A0A0A', textDecoration: 'none' }}>
            {/* Plane hidden on mobile via class */}
            <svg className="nav-plane" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
                stroke="#22D3EE"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              AutoPilot
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 28 }}>
            <Link
              to="/how-it-works"
              className="nav-underline"
              style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#0A0A0A'}
              onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
            >
              How it works
            </Link>
            <a
              href="#services"
              className="nav-underline"
              style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', transition: 'color 0.15s' }}
              onClick={e => { e.preventDefault(); smoothScrollTo('services') }}
              onMouseEnter={e => e.currentTarget.style.color = '#0A0A0A'}
              onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
            >
              Services
            </a>
            <a
              href="#faq"
              className="nav-underline"
              style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', transition: 'color 0.15s' }}
              onClick={e => { e.preventDefault(); smoothScrollTo('faq') }}
              onMouseEnter={e => e.currentTarget.style.color = '#0A0A0A'}
              onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
            >
              FAQ
            </a>
            <Link
              to="/pricing"
              className="nav-underline"
              style={{ fontSize: 14, color: '#6B7280', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#0A0A0A'}
              onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
            >
              Pricing
            </Link>
            <Link
              to="/login"
              style={{
                fontSize: 14, color: '#0A0A0A', textDecoration: 'none',
                padding: '6px 16px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.12)', transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.22)'; e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.background = 'transparent' }}
            >
              Sign in
            </Link>
            <ShimmerButton
              to="/signup"
              style={{ backgroundColor: '#22D3EE', color: '#04141A', fontSize: 14, fontWeight: 600, padding: '6px 18px', borderRadius: 8, textDecoration: 'none', boxShadow: '0 4px 16px rgba(34,211,238,0.30)' }}
            >
              Sign up
            </ShimmerButton>
          </div>

          {/* Mobile right: Sign in + Sign up + hamburger */}
          <div className="flex sm:hidden" style={{ alignItems: 'center', gap: 8 }}>
            <Link
              to="/login"
              style={{
                fontSize: 13, color: '#0A0A0A', textDecoration: 'none',
                padding: '6px 13px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.12)',
              }}
            >
              Sign in
            </Link>
            <ShimmerButton
              to="/signup"
              style={{ backgroundColor: '#22D3EE', color: '#04141A', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 8, textDecoration: 'none' }}
            >
              Sign up
            </ShimmerButton>
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
              style={{
                width: 36, height: 36, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              }}
            >
              <span style={{ width: 18, height: 1.5, backgroundColor: '#0A0A0A', display: 'block', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(3.5px)' : 'none' }} />
              <span style={{ width: 18, height: 1.5, backgroundColor: '#0A0A0A', display: 'block', opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
              <span style={{ width: 18, height: 1.5, backgroundColor: '#0A0A0A', display: 'block', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-3.5px)' : 'none' }} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile dropdown menu — slides in from top-right */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="sm:hidden"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: 64, right: 16, zIndex: 49,
              width: 200,
              backgroundColor: 'rgba(255,255,255,0.98)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '6px',
              transformOrigin: 'top right',
            }}
          >
            {[
              { label: 'How it works', to: '/how-it-works', type: 'link' },
              { label: 'Services',     href: '#services',   type: 'scroll' },
              { label: 'FAQ',          href: '#faq',        type: 'scroll' },
              { label: 'Pricing',      to: '/pricing',      type: 'link' },
            ].map((item, i, arr) => (
              item.type === 'link' ? (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block', fontSize: 14, fontWeight: 500,
                    color: '#0A0A0A', textDecoration: 'none',
                    padding: '10px 14px', borderRadius: 9,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={e => { e.preventDefault(); setMenuOpen(false); smoothScrollTo(item.href.slice(1)) }}
                  style={{
                    display: 'block', fontSize: 14, fontWeight: 500,
                    color: '#0A0A0A', textDecoration: 'none',
                    padding: '10px 14px', borderRadius: 9,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {item.label}
                </a>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
