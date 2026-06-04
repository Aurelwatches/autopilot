import { NavLink, useNavigate } from 'react-router-dom'

const C = {
  bg: '#0A0A0A', card: '#141414', border: '#1E1E1E',
  primary: '#F0EEE9', secondary: '#888780', muted: '#3A3835',
  accent: '#4A90D9',
}

const RESTAURANT = "Mario's Trattoria"

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
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.128L8 10.5l-3.708 2.08L5 8.452 2 5.528l4.146-.772L8 1z"/>
      </svg>
    ),
  },
  {
    path: '/dashboard/posts',
    label: 'Social Posts',
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
    path: '/dashboard/followups',
    label: 'Follow-ups',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M14 4H2a1 1 0 00-1 1v7a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1zm-1.5 2.5l-4.5 3-4.5-3V5.8l4.5 3 4.5-3V6.5z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    path: '/dashboard/messages',
    label: 'Messages',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
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

export default function Sidebar() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('ap_session')
    navigate('/login')
  }

  return (
    <aside
      className="fixed top-0 left-0 bottom-0 flex flex-col z-40"
      style={{ width: 240, backgroundColor: C.bg, borderRight: `1px solid ${C.border}` }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
            stroke={C.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-sm font-semibold tracking-tight" style={{ color: C.primary }}>AutoPilot</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            className="flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors"
            style={({ isActive }) => ({
              color: isActive ? C.primary : C.secondary,
              backgroundColor: isActive ? '#1A1A1A' : 'transparent',
              borderLeft: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
            })}
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-5 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
        <p className="text-xs font-medium mb-0.5 truncate" style={{ color: C.primary }}>
          {RESTAURANT}
        </p>
        <button
          onClick={handleLogout}
          className="text-xs transition-colors"
          style={{ color: C.secondary }}
          onMouseEnter={e => e.target.style.color = C.primary}
          onMouseLeave={e => e.target.style.color = C.secondary}
        >
          Log out
        </button>
      </div>
    </aside>
  )
}
