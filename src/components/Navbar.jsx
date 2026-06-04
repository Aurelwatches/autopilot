import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { smoothScrollTo } from '../utils/smoothScroll'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? 'border-b border-[#2A2A2A]' : ''
      }`}
      style={{
        backgroundColor: scrolled ? 'rgba(10,10,10,0.72)' : 'rgba(10,10,10,0.35)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5" style={{ color: '#F0EEE9' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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

        <div className="flex items-center gap-6">
          <a
            href="#features"
            className="text-sm transition-colors hidden sm:block"
            style={{ color: '#888780' }}
            onClick={e => { e.preventDefault(); smoothScrollTo('features') }}
            onMouseEnter={e => e.target.style.color = '#F0EEE9'}
            onMouseLeave={e => e.target.style.color = '#888780'}
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm transition-colors hidden sm:block"
            style={{ color: '#888780' }}
            onClick={e => { e.preventDefault(); smoothScrollTo('pricing') }}
            onMouseEnter={e => e.target.style.color = '#F0EEE9'}
            onMouseLeave={e => e.target.style.color = '#888780'}
          >
            Pricing
          </a>
          <Link
            to="/login"
            className="text-sm px-4 py-1.5 rounded transition-colors hidden sm:block"
            style={{ color: '#F0EEE9', border: '1px solid rgba(240,238,233,0.25)', backgroundColor: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(240,238,233,0.6)'; e.currentTarget.style.backgroundColor = 'rgba(240,238,233,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(240,238,233,0.25)'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="text-sm font-semibold px-4 py-1.5 rounded transition-colors"
            style={{ backgroundColor: '#F0EEE9', color: '#0A0A0A' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e4e2dd'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F0EEE9'}
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  )
}
