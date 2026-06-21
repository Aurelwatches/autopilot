import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import SupportChat from './SupportChat'
import { DashboardProvider } from './DashboardContext'
import { AppProvider, useApp } from './AppContext'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import DashboardSkeleton from './DashboardSkeleton'
import Onboarding from './Onboarding'
import RevealCtx from './revealContext'

const ADMIN_EMAIL = 'bray.200913@gmail.com'

const SKELETON_MS = 1500

function LoadingScreen() {
  // Renders before AppProvider mounts — use CSS vars directly (they're global on <html>)
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: 'var(--ap-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none" style={{ margin: '0 auto 12px', display: 'block' }}>
          <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
            stroke="var(--ap-text2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ fontSize: 12, color: 'var(--ap-text2)' }}>Loading…</p>
      </div>
    </div>
  )
}

function DashboardContent() {
  const { C, theme } = useApp()
  const isDark = theme === 'dark'

  // Mobile slide-in drawer (< 768px)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const closeNav = () => setMobileNavOpen(false)

  // Lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileNavOpen])

  // Skeleton only on first visit per session, dark mode only
  const [revealed,      setRevealed]      = useState(() => !isDark || !!sessionStorage.getItem('ap_dl'))
  const [showSkeleton,  setShowSkeleton]  = useState(() =>  isDark && !sessionStorage.getItem('ap_dl'))
  const [mountSkeleton, setMountSkeleton] = useState(() =>  isDark && !sessionStorage.getItem('ap_dl'))

  useEffect(() => {
    if (revealed) return
    const t1 = setTimeout(() => {
      setShowSkeleton(false)
      setRevealed(true)
      sessionStorage.setItem('ap_dl', '1')
    }, SKELETON_MS)
    const t2 = setTimeout(() => setMountSkeleton(false), SKELETON_MS + 320)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    // Body background/color inherit from CSS vars — just reset any stale inline values
    document.body.style.backgroundColor = 'var(--ap-bg)'
    document.body.style.color = 'var(--ap-text)'
  }, [theme])

  useEffect(() => {
    console.log('[AutoPilot] DashboardContent — theme:', theme, '| isDark:', isDark, '| light blobs in DOM:', !isDark)
  }, [isDark])

  return (
    <RevealCtx.Provider value={revealed}>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: C.bg, position: 'relative' }}>

        {/* Dark mode: deep purple/blue ambient blobs visible through glass surfaces */}
        {isDark && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: '-15%', right: '-5%',
              width: 600, height: 600, borderRadius: '50%',
              background: 'radial-gradient(circle, #0B3A6B 0%, transparent 70%)',
              opacity: 0.22, filter: 'blur(50px)',
              animation: 'heroBlobA 15s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', bottom: '-15%', left: '-5%',
              width: 640, height: 640, borderRadius: '50%',
              background: 'radial-gradient(circle, #073B46 0%, transparent 70%)',
              opacity: 0.2, filter: 'blur(50px)',
              animation: 'heroBlobB 15s ease-in-out infinite',
            }} />
          </div>
        )}

        {/* Light mode: soft warm purple/blue blobs for depth on the off-white background */}
        {!isDark && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: '-10%', left: '-5%',
              width: 800, height: 800, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)',
              filter: 'blur(60px)',
              animation: 'heroBlobA 18s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', bottom: '-10%', right: '-5%',
              width: 800, height: 800, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%)',
              filter: 'blur(60px)',
              animation: 'heroBlobB 18s ease-in-out infinite',
            }} />
          </div>
        )}

        <Sidebar mobileOpen={mobileNavOpen} onClose={closeNav} />

        {/* Dark overlay behind the drawer — mobile only (CSS hides on desktop) */}
        {mobileNavOpen && (
          <div
            className="ap-mobile-overlay"
            onClick={closeNav}
            style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)' }}
          />
        )}

        <main className="ap-main" style={{ position: 'relative', zIndex: 1, marginLeft: 240, flex: 1, minHeight: '100vh', color: C.primary }}>

          {/* Mobile topbar with hamburger — hidden on desktop via CSS */}
          <div
            className="ap-topbar"
            style={{
              position: 'sticky', top: 0, zIndex: 45,
              alignItems: 'center', gap: 12, height: 56, padding: '0 16px',
              backgroundColor: C.bg,
              borderBottom: `1px solid ${C.border}`,
              backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
            }}
          >
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44, marginLeft: -8,
                color: C.primary, background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="text-sm font-semibold tracking-tight" style={{ color: C.primary }}>AutoPilot</span>
          </div>

          <Outlet />
        </main>
        <SupportChat />
        <Onboarding />

        {mountSkeleton && <DashboardSkeleton hidden={!showSkeleton} />}
      </div>
    </RevealCtx.Provider>
  )
}

export default function DashboardLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [subStatus, setSubStatus] = useState(null) // null = checking
  const [plan,      setPlan]      = useState(null)
  const [subChecked, setSubChecked] = useState(false)

  useEffect(() => {
    if (!user) { setSubChecked(true); return }

    // Admin bypasses all subscription/plan checks — treated as Pro
    if (user.email === ADMIN_EMAIL) {
      setSubStatus('active')
      setPlan('pro')
      setSubChecked(true)
      return
    }

    supabase
      .from('profiles')
      .select('subscription_status, plan')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setSubStatus(data?.subscription_status ?? null)
        setPlan(data?.plan ?? null)
        setSubChecked(true)
      })
      .catch(() => {
        // On error allow access rather than locking users out
        setSubStatus('active')
        setPlan('starter')
        setSubChecked(true)
      })
  }, [user])

  if (loading || !subChecked) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  const from = encodeURIComponent(location.pathname)
  if (subStatus !== 'active') return <Navigate to={`/pricing?message=subscribe&from=${from}`} replace />
  if (!plan) return <Navigate to={`/pricing?from=${from}`} replace />

  return (
    <AppProvider initialPlan={plan}>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </AppProvider>
  )
}
