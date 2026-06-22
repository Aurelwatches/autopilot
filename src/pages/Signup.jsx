import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import EyeToggle from '../components/EyeToggle'

export default function Signup() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle, signInWithApple } = useAuth()

  const [restaurantName, setRestaurantName] = useState('')
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [showPw,         setShowPw]         = useState(false)
  const [error,          setError]          = useState('')
  const [loading,        setLoading]        = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!restaurantName.trim() || !email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
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

    const selectedPlan = localStorage.getItem('ap_selected_plan')
    navigate(selectedPlan ? '/checkout' : '/dashboard')
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
          Create your account
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 28px' }}>
          Set up AutoPilot for your restaurant. Free for 14 days.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>
              Restaurant name
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={e => { setRestaurantName(e.target.value); setError('') }}
              placeholder="Mario's Trattoria"
              autoComplete="organization"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#22D3EE'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'}
            />
          </div>

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
              Password{' '}
              <span style={{ color: '#9CA3AF', fontWeight: 400 }}>min. 8 characters</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                autoComplete="new-password"
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
            {loading ? 'Creating account…' : 'Start free trial'}
          </button>

          <p style={{ fontSize: 12, textAlign: 'center', color: '#9CA3AF', lineHeight: 1.6, margin: 0 }}>
            By signing up you agree to our{' '}
            <Link to="/terms" style={{ color: '#6B7280', textDecoration: 'underline' }}>Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" style={{ color: '#6B7280', textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 0' }}>
          <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
          <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>or sign up with</span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.12)', backgroundColor: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#0A0A0A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#22D3EE'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(34,211,238,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => signInWithApple()}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.12)', backgroundColor: '#0A0A0A',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            <svg width="16" height="18" viewBox="0 0 814 1000" fill="white">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.8-155.5-127.4C46 664.1 0 546.8 0 435.1 0 226.7 140.5 113.8 278.6 113.8c74.1 0 135.7 48.6 181.9 48.6 44.2 0 113.8-51.7 203.1-51.7 32.3 0 131 3.2 197.4 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        <p style={{ fontSize: 13, textAlign: 'center', marginTop: 24, color: '#9CA3AF' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#22D3EE', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>

      <p style={{ fontSize: 13, marginTop: 20, color: '#9CA3AF' }}>
        <Link to="/" style={{ color: '#6B7280', textDecoration: 'none' }}>← Back to homepage</Link>
      </p>
    </div>
  )
}
