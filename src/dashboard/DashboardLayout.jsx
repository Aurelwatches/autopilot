import { Outlet, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import SupportChat from './SupportChat'
import { DashboardProvider } from './DashboardContext'
import { AppProvider, useApp } from './AppContext'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import DashboardSkeleton from './DashboardSkeleton'
import RevealCtx from './revealContext'

const ADMIN_EMAIL = 'bray.200913@gmail.com'

const SKELETON_MS = 1500

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#000000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none" style={{ margin: '0 auto 12px', display: 'block' }}>
          <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
            stroke="#3A3835" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ fontSize: 12, color: '#3A3835' }}>Loading…</p>
      </div>
    </div>
  )
}

function DashboardContent() {
  const { C, theme } = useApp()
  const isDark = theme === 'dark'

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

  return (
    <RevealCtx.Provider value={revealed}>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: C.bg, position: 'relative' }}>

        {/* Ambient gradient blobs — always present in dark mode, visible through glass surfaces */}
        {isDark && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: '-15%', right: '-5%',
              width: 600, height: 600, borderRadius: '50%',
              background: 'radial-gradient(circle, #3B0764 0%, transparent 70%)',
              opacity: 0.2, filter: 'blur(50px)',
              animation: 'heroBlobA 15s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', bottom: '-15%', left: '-5%',
              width: 640, height: 640, borderRadius: '50%',
              background: 'radial-gradient(circle, #0C1A4E 0%, transparent 70%)',
              opacity: 0.2, filter: 'blur(50px)',
              animation: 'heroBlobB 15s ease-in-out infinite',
            }} />
          </div>
        )}

        <Sidebar />
        <main style={{ position: 'relative', zIndex: 1, marginLeft: 240, flex: 1, minHeight: '100vh', color: C.primary }}>
          <Outlet />
        </main>
        <SupportChat />

        {mountSkeleton && <DashboardSkeleton hidden={!showSkeleton} />}
      </div>
    </RevealCtx.Provider>
  )
}

export default function DashboardLayout() {
  const { user, loading } = useAuth()
  const [subStatus, setSubStatus] = useState(null) // null = checking
  const [subChecked, setSubChecked] = useState(false)

  useEffect(() => {
    if (!user) { setSubChecked(true); return }
    if (user.email === ADMIN_EMAIL) { setSubStatus('active'); setSubChecked(true); return }

    supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setSubStatus(data?.subscription_status ?? null)
        setSubChecked(true)
      })
      .catch(() => {
        // On error allow access rather than locking users out
        setSubStatus('active')
        setSubChecked(true)
      })
  }, [user])

  if (loading || !subChecked) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (subStatus !== 'active') return <Navigate to="/pricing?message=subscribe" replace />

  return (
    <AppProvider>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </AppProvider>
  )
}
