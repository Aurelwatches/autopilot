import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DashboardLayout from './dashboard/DashboardLayout'
import Overview from './dashboard/pages/Overview'
import Reviews from './dashboard/pages/Reviews'
import SocialPosts from './dashboard/pages/SocialPosts'
import FollowUps from './dashboard/pages/FollowUps'
import Analytics from './dashboard/pages/Analytics'
import Settings from './dashboard/pages/Settings'
import Messages from './dashboard/pages/Messages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* DashboardLayout handles its own auth redirect internally */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="overview"  element={<Overview />} />
          <Route path="reviews"   element={<Reviews />} />
          <Route path="posts"     element={<SocialPosts />} />
          <Route path="followups" element={<FollowUps />} />
          <Route path="messages"  element={<Messages />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings"  element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
