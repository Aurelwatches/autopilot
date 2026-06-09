import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import EyeToggle from '../components/EyeToggle'
import LoginPlane from '../components/LoginPlane'

const ADMIN_EMAIL = 'bray.200913@gmail.com'

// All colours come from CSS variables (index.css), which switch automatically
// when [data-theme="light"] is set on <html> by the anti-FOUC script / AppContext.
const V = {
  bg:      'var(--ap-bg)',
  card:    'var(--ap-card-solid)',
  border:  'var(--ap-border-solid)',
  input:   'var(--ap-input-solid)',
  text:    'var(--ap-text)',
  text2:   'var(--ap-text2)',
  text3:   'var(--ap-text3b)',
  shadow:  'var(--ap-shadow)',
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  // Message shown when arriving from the pricing page ("Sign in to continue…")
  const notice = location.state?.message

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [flying,   setFlying]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }

    setLoading(true)
    setError('')

    const { user, error: authError } = await signIn(email, password)

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Only divert to checkout when a plan was chosen on /pricing AND the user
    // doesn't already have an active subscription. Existing subscribers (and the
    // admin) go straight to the dashboard via the cinematic airplane takeoff.
    const hasSelectedPlan = !!localStorage.getItem('ap_selected_plan')
    let hasActiveSub = false

    if (user) {
      if (user.email === ADMIN_EMAIL) {
        hasActiveSub = true
      } else {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', user.id)
            .single()
          hasActiveSub = data?.subscription_status === 'active'
        } catch {
          hasActiveSub = false
        }
      }
    }

    if (hasSelectedPlan && !hasActiveSub) {
      navigate('/checkout')
    } else {
      setFlying(true)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: V.bg }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-10" style={{ color: V.text }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-sm font-semibold tracking-tight">AutoPilot</span>
      </Link>

      <div
        className="w-full rounded-2xl px-8 py-10"
        style={{
          maxWidth: 400,
          backgroundColor: V.card,
          border: `1px solid ${V.border}`,
          boxShadow: V.shadow,
        }}
      >
        <h1 className="text-xl font-semibold mb-1" style={{ color: V.text }}>Welcome back</h1>
        <p className="text-sm mb-8" style={{ color: V.text2 }}>Sign in to your AutoPilot account.</p>

        {notice && (
          <div
            className="text-sm mb-6 px-4 py-3 rounded-lg"
            style={{
              backgroundColor: 'rgba(74,142,255,0.10)',
              border: '1px solid rgba(74,142,255,0.25)',
              color: 'var(--ap-accent)',
            }}
          >
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: V.text2 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="you@restaurant.com"
              autoComplete="email"
              className="w-full text-sm px-4 py-2.5 rounded-lg outline-none"
              style={{ backgroundColor: V.input, color: V.text, border: `1px solid ${V.border}` }}
              onFocus={e => e.target.style.borderColor = 'var(--ap-accent)'}
              onBlur={e => e.target.style.borderColor = V.border}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: V.text2 }}>Password</label>
            <div className="relative mt-1.5">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full text-sm pl-4 pr-11 py-2.5 rounded-lg outline-none"
                style={{ backgroundColor: V.input, color: V.text, border: `1px solid ${V.border}` }}
                onFocus={e => e.target.style.borderColor = 'var(--ap-accent)'}
                onBlur={e => e.target.style.borderColor = V.border}
              />
              <EyeToggle visible={showPw} onClick={() => setShowPw(s => !s)} color={V.text2} />
            </div>
          </div>

          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-semibold py-2.5 rounded-lg mt-2"
            style={{
              backgroundColor: loading ? 'rgba(10,10,10,0.5)' : V.text,
              color: V.bg,
              cursor: loading ? 'default' : 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            {loading ? 'Signing in…' : 'Sign in to AutoPilot'}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: V.text3 }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: V.text2 }}>Sign up</Link>
        </p>
      </div>

      <p className="text-xs mt-6" style={{ color: V.text3 }}>
        <Link to="/" style={{ color: V.text2 }}>← Back to homepage</Link>
      </p>

      {flying && <LoginPlane onDone={() => navigate('/dashboard')} />}
    </div>
  )
}
