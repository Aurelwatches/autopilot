import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import SupportChat from './SupportChat'
import { DashboardProvider } from './DashboardContext'

export default function DashboardLayout() {
  if (localStorage.getItem('ap_session') !== 'true') {
    return <Navigate to="/login" replace />
  }

  return (
    <DashboardProvider>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0A0A0A' }}>
        <Sidebar />
        <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', color: '#F0EEE9' }}>
          <Outlet />
        </main>
        <SupportChat />
      </div>
    </DashboardProvider>
  )
}
