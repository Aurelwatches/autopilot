import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import EyeToggle from '../components/EyeToggle'
import LoginPlane from '../components/LoginPlane'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  const notice = location.state?.message

  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [showPw,        setShowPw]        = useState(false)
  const [error,         setError]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [flying,        setFlying]        = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [oauthError,    setOauthError]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }

    setLoading(true)
    setError('')

    const { error: authError } = await signIn(email, password)

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Sign-in always goes to dashboard — checkout redirect is signup's job only
    setFlying(true)
  }

  function handleGoogle() {
    setGoogleLoading(true)
    setOauthError('')
    // Redirect to Railway backend — custom OAuth so Google shows "getautopilot.net" not Supabase's domain
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google/user-signin`
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
            <label htmlFor="login-email" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>
              Email
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
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
            <p role="alert" aria-live="assertive" style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{error}</p>
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

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 0' }}>
          <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
          <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>or continue with</span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
        </div>

        {/* Social buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.12)', backgroundColor: '#fff',
              fontSize: 14, fontWeight: 600,
              cursor: googleLoading ? 'default' : 'pointer',
              color: '#3c4043',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={e => { if (!googleLoading) { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(66,133,244,0.18)' } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            {googleLoading ? (
              <span style={{ width: 20, height: 20, border: '2px solid #4285F4', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {oauthError && (
            <p role="alert" style={{ fontSize: 13, color: '#EF4444', margin: '2px 0 0', textAlign: 'center' }}>{oauthError}</p>
          )}
        </div>

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
