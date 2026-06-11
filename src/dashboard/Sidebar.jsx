import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from './AppContext'
import { useAuth } from '../lib/auth'
import { useDashboardReveal } from './revealContext'
import { getPlanMeta, getBillingInterval, planPrice } from './planMeta'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const navItems = [
  {
    path: '/dashboard/overview',
    label: 'Overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="6" height="6" rx="1.2"/>
        <rect x="9" y="1" width="6" height="6" rx="1.2"/>
        <rect x="1" y="9" width="6" height="6" rx="1.2"/>
        <rect x="9" y="9" width="6" height="6" rx="1.2"/>
      </svg>
    ),
  },
  {
    path: '/dashboard/reviews',
    label: 'Reviews',
    tour: 'reviews',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.128L8 10.5l-3.708 2.08L5 8.452 2 5.528l4.146-.772L8 1z"/>
      </svg>
    ),
  },
  {
    path: '/dashboard/posts',
    label: 'Social Posts',
    tour: 'posts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12.5" cy="3.5" r="1.5"/>
        <circle cx="12.5" cy="12.5" r="1.5"/>
        <circle cx="3.5" cy="8" r="1.5"/>
        <line x1="5" y1="8" x2="11" y2="4.2"/>
        <line x1="5" y1="8" x2="11" y2="11.8"/>
      </svg>
    ),
  },
  {
    path: '/dashboard/analytics',
    label: 'Analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="9" width="3" height="6" rx="0.5"/>
        <rect x="6" y="5" width="3" height="10" rx="0.5"/>
        <rect x="11" y="1" width="3" height="14" rx="0.5"/>
      </svg>
    ),
  },
  {
    path: '/dashboard/settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M8 5a3 3 0 100 6A3 3 0 008 5zm-1.5 3a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd"/>
        <path fillRule="evenodd" d="M8 1a1 1 0 011 1v.1a5.985 5.985 0 011.634.677l.07-.07a1 1 0 011.415 1.415l-.07.07A5.985 5.985 0 0112.9 6H13a1 1 0 110 2h-.1a5.985 5.985 0 01-.677 1.634l.07.07a1 1 0 01-1.415 1.415l-.07-.07A5.985 5.985 0 019 11.9V12a1 1 0 11-2 0v-.1a5.985 5.985 0 01-1.634-.677l-.07.07a1 1 0 01-1.415-1.415l.07-.07A5.985 5.985 0 013.1 8H3a1 1 0 110-2h.1a5.985 5.985 0 01.677-1.634l-.07-.07a1 1 0 011.415-1.415l.07.07A5.985 5.985 0 017 2.1V2a1 1 0 011-1z" clipRule="evenodd"/>
      </svg>
    ),
  },
]

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  )
}

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const navigate = useNavigate()
  const { C, theme, toggleTheme, restaurantName, plan } = useApp()
  const { signOut, user } = useAuth()
  const revealed = useDashboardReveal()

  const isPro = plan === 'pro'

  // Current plan label shown under the restaurant name
  const planMeta   = getPlanMeta(plan)
  const isYearly   = getBillingInterval() === 'yearly'
  const planPriceN = planPrice(planMeta, isYearly ? 'yearly' : 'monthly')
  let planLabel = `${planMeta.label} plan`
  if (planMeta.key === 'pro') planLabel += ` · $${planPriceN.toLocaleString()}/${isYearly ? 'yr' : 'mo'}`
  if (isYearly) planLabel += ' · billed yearly'

  async function handleLogout() {
    onClose()
    await signOut()
    navigate('/login')
  }

  return (
    <aside
      data-tour="sidebar"
      className={`ap-sidebar fixed top-0 left-0 bottom-0 flex flex-col z-40${mobileOpen ? ' ap-sidebar--open' : ''}`}
      style={{
        width: 240,
        backgroundColor: C.sidebarBg,
        borderRight: `1px solid ${C.sidebarBorder}`,
        boxShadow: 'var(--ap-sidebar-shadow)',
        backdropFilter: C.glassFilter,
        WebkitBackdropFilter: C.glassFilter,
      }}
    >
      {/* Logo + theme toggle */}
      <div className="px-5 py-5 flex items-center justify-between" style={{
        borderBottom: `1px solid ${C.divider}`,
        opacity: revealed ? 1 : 0,
        transition: `opacity 400ms ${EASE}`,
      }}>
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
              stroke={isPro ? '#F5B43C' : C.accent}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-base font-bold tracking-tight" style={{ color: C.primary, fontFamily: 'var(--font-display)' }}>
            AutoPilot
            {isPro && (
              <span style={{
                color: '#F5B43C',
                textShadow: '0 0 14px rgba(245,180,60,0.5)',
              }}> Pro</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              color: C.muted, padding: 4, borderRadius: 6,
              border: `1px solid ${C.border}`,
              backgroundColor: 'transparent',
              cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.secondary; e.currentTarget.style.borderColor = C.secondary }}
            onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border }}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          {/* Close drawer — mobile only */}
          <button
            className="ap-sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              color: C.muted, width: 32, height: 32, borderRadius: 6,
              border: `1px solid ${C.border}`,
              backgroundColor: 'transparent', cursor: 'pointer',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon, tour }, index) => (
          <NavLink
            key={path}
            to={path}
            data-tour={tour}
            onClick={onClose}
            className="ap-nav-link flex items-center gap-3 px-3 py-2 rounded text-sm"
            style={({ isActive }) => ({
              color: isActive ? C.primary : C.secondary,
              backgroundColor: isActive ? C.sidebarActiveBg : 'transparent',
              borderLeft: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateX(0)' : 'translateX(-14px)',
              transition: `color 0.15s, background-color 0.15s, opacity 400ms ${EASE}, transform 400ms ${EASE}`,
              transitionDelay: revealed ? `${index * 50}ms` : '0ms',
            })}
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: restaurant name + Pro badge + email + logout */}
      <div className="px-5 py-4" style={{
        borderTop: `1px solid ${C.divider}`,
        opacity: revealed ? 1 : 0,
        transition: `opacity 400ms ${EASE}`,
        transitionDelay: revealed ? '280ms' : '0ms',
      }}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-xs font-semibold truncate" style={{ color: C.primary }}>
            {restaurantName}
          </p>
          {isPro && (
            <span style={{
              flexShrink: 0,
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
              padding: '1px 5px', borderRadius: 4,
              backgroundColor: 'rgba(245,180,60,0.14)',
              color: '#F5B43C',
              border: '1px solid rgba(245,180,60,0.28)',
            }}>PRO</span>
          )}
        </div>
        <p className="text-[10px] font-medium mb-0.5 truncate" style={{ color: planMeta.color }}>
          {planLabel}
        </p>
        {user?.email && (
          <p className="text-[10px] truncate mt-0.5 mb-1" style={{ color: C.muted }}>
            {user.email}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="text-xs transition-colors"
          style={{ color: C.secondary, marginTop: user?.email ? 0 : 4 }}
          onMouseEnter={e => e.target.style.color = C.primary}
          onMouseLeave={e => e.target.style.color = C.secondary}
        >
          Log out
        </button>
      </div>
    </aside>
  )
}
