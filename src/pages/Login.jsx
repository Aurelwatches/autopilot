import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import EyeToggle from '../components/EyeToggle'
import LoginPlane from '../components/LoginPlane'

const ADMIN_EMAIL = 'bray.200913@gmail.com'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

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

  const inputStyle = {
    width: '100%', fontSize: 15, padding: '11px 16px',
    borderRadius: 10, outline: 'none', border: '1px solid rgba(0,0,0,0.12)',
    backgroundColor: 'rgba(0,0,0,0.025)', color: '#0A0A0A',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', backgroundColor: '#FFFFFF',
      backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
      backgroundSize: '64px 64px',
    }}>
      {/* Logo */}
      <Link to="/" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 32, textDecoration: 'none', color: '#0A0A0A',
      }}>
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
          <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
            stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          AutoPilot
        </span>
      </Link>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 20,
        padding: '36px 32px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <h1 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
          color: '#0A0A0A', margin: '0 0 6px',
        }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 28px' }}>
          Sign in to your AutoPilot account.
        </p>

        {notice && (
          <div style={{
            fontSize: 13, marginBottom: 20, padding: '10px 14px', borderRadius: 10,
            backgroundColor: 'rgba(34,211,238,0.08)',
            border: '1px solid rgba(34,211,238,0.35)',
            color: '#0A9BAD',
          }}>
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="you@restaurant.com"
              autoComplete="email"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#22D3EE'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = '#22D3EE'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'}
              />
              <EyeToggle visible={showPw} onClick={() => setShowPw(s => !s)} color="#9CA3AF" />
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px 0',
              borderRadius: 980, border: 'none',
              fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              backgroundColor: '#22D3EE', color: '#04141A',
              opacity: loading ? 0.65 : 1,
              boxShadow: loading ? 'none' : '0 6px 24px rgba(34,211,238,0.38)',
              transition: 'opacity 0.15s, background-color 0.15s',
              marginTop: 4,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#67E8F9' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#22D3EE' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ fontSize: 13, textAlign: 'center', marginTop: 24, color: '#9CA3AF' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#22D3EE', fontWeight: 600, textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>

      <p style={{ fontSize: 13, marginTop: 20, color: '#9CA3AF' }}>
        <Link to="/" style={{ color: '#6B7280', textDecoration: 'none' }}>← Back to homepage</Link>
      </p>

      {flying && <LoginPlane onDone={() => navigate('/dashboard')} />}
    </div>
  )
}
