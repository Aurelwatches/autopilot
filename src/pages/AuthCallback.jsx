import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Handles the redirect from /api/auth/google/user-callback
// Receives ?access_token=&refresh_token=&expires_in= and stores the session
export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search)
      const access_token  = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const errorParam    = params.get('error')

      if (errorParam) {
        const messages = {
          google_denied:  'Google sign-in was cancelled.',
          invalid_state:  'Security check failed. Please try again.',
          auth_failed:    'Sign-in failed. Please try again.',
        }
        setError(messages[errorParam] || 'Sign-in failed. Please try again.')
        setTimeout(() => navigate('/login'), 3000)
        return
      }

      if (!access_token || !refresh_token) {
        setError('Missing session data. Redirecting...')
        setTimeout(() => navigate('/login'), 2000)
        return
      }

      const { error: sessionErr } = await supabase.auth.setSession({ access_token, refresh_token })
      if (sessionErr) {
        setError('Could not restore session. Please try again.')
        setTimeout(() => navigate('/login'), 2000)
        return
      }

      navigate('/dashboard', { replace: true })
    }

    handleCallback()
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#FFFFFF', gap: 16,
    }}>
      {error ? (
        <p style={{ fontSize: 14, color: '#EF4444', textAlign: 'center', maxWidth: 300 }}>{error}</p>
      ) : (
        <>
          <div style={{
            width: 32, height: 32, border: '3px solid #22D3EE',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ fontSize: 14, color: '#6B7280' }}>Signing you in…</p>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
