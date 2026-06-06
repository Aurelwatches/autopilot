import { Outlet, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import SupportChat from './SupportChat'
import { DashboardProvider } from './DashboardContext'
import { AppProvider, useApp } from './AppContext'
import { useAuth } from '../lib/auth'

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
  const { C } = useApp()

  useEffect(() => {
    document.body.style.backgroundColor = C.bg
    document.body.style.color = C.primary
  }, [C])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: C.bg }}>
      <Sidebar />
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', color: C.primary }}>
        <Outlet />
      </main>
      <SupportChat />
    </div>
  )
}

export default function DashboardLayout() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />

  return (
    <AppProvider>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </AppProvider>
  )
}
