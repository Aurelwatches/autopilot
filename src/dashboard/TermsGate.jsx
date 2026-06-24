import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from './AppContext'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const TERMS_VERSION = '2026-06-23' // bump this when terms change to force re-acceptance

export default function TermsGate({ onAccept }) {
  const { C } = useApp()
  const { user } = useAuth()
  const [checked,  setChecked]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleAccept() {
    if (!checked || !user) return
    setLoading(true)
    setError('')
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({
          terms_accepted_at: new Date().toISOString(),
          terms_version: TERMS_VERSION,
        })
        .eq('id', user.id)
      if (err) throw err
      onAccept()
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 32px 24px',
          borderBottom: `1px solid ${C.divider}`,
          background: 'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, transparent 60%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
                stroke="var(--ap-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: C.primary, letterSpacing: '-0.02em' }}>
              Auto<span style={{ color: 'var(--ap-accent)' }}>Pilot</span>
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.primary, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-display)' }}>
            Before you continue
          </h2>
          <p style={{ fontSize: 13, color: C.secondary, marginTop: 6, lineHeight: 1.5 }}>
            We've updated our Terms of Service. Please review and accept to use AutoPilot.
          </p>
        </div>

        {/* Key points */}
        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${C.divider}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>
            What you're agreeing to
          </p>
          {[
            {
              icon: '🤖',
              text: 'AI-generated content may be inaccurate. You are responsible for reviewing replies before they go out.',
            },
            {
              icon: '⚡',
              text: 'Auto-post is your choice. If enabled, content publishes without manual review — that's on you.',
            },
            {
              icon: '🛡️',
              text: 'AutoPilot is not liable for AI mistakes, wrong replies, or platform penalties on your accounts.',
            },
            {
              icon: '💳',
              text: 'No refunds after 30 days. Subscriptions renew automatically until cancelled.',
            },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <p style={{ fontSize: 13, color: C.secondary, lineHeight: 1.5, margin: 0 }}>{text}</p>
            </div>
          ))}
          <p style={{ fontSize: 12, color: C.muted, marginTop: 14, lineHeight: 1.5 }}>
            Read the full{' '}
            <Link to="/terms" target="_blank" style={{ color: 'var(--ap-accent)' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" target="_blank" style={{ color: 'var(--ap-accent)' }}>Privacy Policy</Link>.
          </p>
        </div>

        {/* Checkbox + button */}
        <div style={{ padding: '20px 32px 28px' }}>
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            cursor: 'pointer', marginBottom: 20,
          }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--ap-accent)' }}
            />
            <span style={{ fontSize: 13, color: C.secondary, lineHeight: 1.5 }}>
              I have read and agree to the{' '}
              <Link to="/terms" target="_blank" style={{ color: 'var(--ap-accent)' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" target="_blank" style={{ color: 'var(--ap-accent)' }}>Privacy Policy</Link>,
              including the AI content disclaimer and limitation of liability.
            </span>
          </label>

          {error && (
            <p style={{ fontSize: 12, color: 'rgb(239,68,68)', marginBottom: 12 }}>{error}</p>
          )}

          <button
            onClick={handleAccept}
            disabled={!checked || loading}
            style={{
              width: '100%', padding: '13px 0',
              borderRadius: 10, border: 'none', cursor: (!checked || loading) ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
              backgroundColor: checked ? 'var(--ap-accent)' : C.border,
              color: checked ? 'var(--ap-on-accent, #0a0a0a)' : C.muted,
              transition: 'background-color 200ms, color 200ms',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Saving…' : 'Accept & Continue →'}
          </button>

          <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
            By continuing you confirm you are authorised to agree on behalf of your business.
            Accepted {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {user?.email}
          </p>
        </div>
      </div>
    </div>
  )
}
