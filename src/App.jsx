import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Admin from './pages/Admin'
import DashboardLayout from './dashboard/DashboardLayout'
import Overview from './dashboard/pages/Overview'
import Reviews from './dashboard/pages/Reviews'
import SocialPosts from './dashboard/pages/SocialPosts'
import Analytics from './dashboard/pages/Analytics'
import Settings from './dashboard/pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard/overview" replace />} />
            <Route path="overview"  element={<Overview />} />
            <Route path="reviews"   element={<Reviews />} />
            <Route path="posts"     element={<SocialPosts />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings"  element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
