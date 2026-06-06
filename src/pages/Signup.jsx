import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const C = {
  bg: '#0A0A0A', card: '#141414', border: '#2A2A2A',
  primary: '#F0EEE9', secondary: '#888780', muted: '#3A3835',
}

export default function Signup() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [restaurantName, setRestaurantName] = useState('')
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [error,          setError]          = useState('')
  const [loading,        setLoading]        = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!restaurantName.trim() || !email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')

    const { error: authError } = await signUp(email, password, restaurantName.trim())

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: C.bg }}
    >
      <Link to="/" className="flex items-center gap-2 mb-10" style={{ color: C.primary }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-sm font-semibold tracking-tight">AutoPilot</span>
      </Link>

      <div
        className="w-full rounded-lg px-8 py-10"
        style={{ maxWidth: 400, backgroundColor: C.card, border: `1px solid ${C.border}` }}
      >
        <h1 className="text-xl font-semibold mb-1" style={{ color: C.primary }}>Create your account</h1>
        <p className="text-sm mb-8" style={{ color: C.secondary }}>Set up AutoPilot for your restaurant.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>
              Restaurant name
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={e => { setRestaurantName(e.target.value); setError('') }}
              placeholder="Mario's Trattoria"
              autoComplete="organization"
              className="w-full text-sm px-4 py-2.5 rounded outline-none"
              style={{ backgroundColor: '#0F0F0F', color: C.primary, border: `1px solid ${C.border}` }}
              onFocus={e => e.target.style.borderColor = C.secondary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="you@restaurant.com"
              autoComplete="email"
              className="w-full text-sm px-4 py-2.5 rounded outline-none"
              style={{ backgroundColor: '#0F0F0F', color: C.primary, border: `1px solid ${C.border}` }}
              onFocus={e => e.target.style.borderColor = C.secondary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>
              Password
              <span style={{ color: C.muted, fontWeight: 400, marginLeft: 6 }}>min. 6 characters</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full text-sm px-4 py-2.5 rounded outline-none"
              style={{ backgroundColor: '#0F0F0F', color: C.primary, border: `1px solid ${C.border}` }}
              onFocus={e => e.target.style.borderColor = C.secondary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-semibold py-2.5 rounded mt-2"
            style={{
              backgroundColor: loading ? 'rgba(240,238,233,0.5)' : C.primary,
              color: '#0A0A0A',
              cursor: loading ? 'default' : 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#e4e2dd' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = C.primary }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-xs text-center leading-relaxed" style={{ color: C.muted }}>
            By signing up you agree to our{' '}
            <Link to="/terms" style={{ color: C.secondary, textDecoration: 'underline' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" style={{ color: C.secondary, textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: C.muted }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: C.secondary }}>Sign in</Link>
        </p>
      </div>

      <p className="text-xs mt-6" style={{ color: C.muted }}>
        <Link to="/" style={{ color: C.secondary }}>← Back to homepage</Link>
      </p>
    </div>
  )
}
