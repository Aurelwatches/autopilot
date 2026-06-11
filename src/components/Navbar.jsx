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
        scrolled ? 'border-b' : ''
      }`}
      style={{
        backgroundColor: scrolled ? 'rgba(11,10,9,0.72)' : 'rgba(11,10,9,0.35)',
        borderColor: scrolled ? 'rgba(255,255,255,0.08)' : 'transparent',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5" style={{ color: '#F5F1E8' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
              stroke="#FB7A1E"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-base font-bold tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>AutoPilot</span>
        </a>

        <div className="flex items-center gap-6">
          <a
            href="#features"
            className="text-sm transition-colors hidden sm:block"
            style={{ color: '#A39B8E' }}
            onClick={e => { e.preventDefault(); smoothScrollTo('features') }}
            onMouseEnter={e => e.target.style.color = '#F5F1E8'}
            onMouseLeave={e => e.target.style.color = '#A39B8E'}
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm transition-colors hidden sm:block"
            style={{ color: '#A39B8E' }}
            onClick={e => { e.preventDefault(); smoothScrollTo('pricing') }}
            onMouseEnter={e => e.target.style.color = '#F5F1E8'}
            onMouseLeave={e => e.target.style.color = '#A39B8E'}
          >
            Pricing
          </a>
          <Link
            to="/login"
            className="text-sm px-4 py-1.5 rounded-lg transition-colors hidden sm:block"
            style={{ color: '#F5F1E8', border: '1px solid rgba(245,241,232,0.18)', backgroundColor: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,241,232,0.45)'; e.currentTarget.style.backgroundColor = 'rgba(245,241,232,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,241,232,0.18)'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-all"
            style={{ backgroundColor: '#FB7A1E', color: '#2A1606', boxShadow: '0 4px 16px rgba(251,122,30,0.32)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FF8C3A'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(251,122,30,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FB7A1E'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(251,122,30,0.32)' }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  )
}
