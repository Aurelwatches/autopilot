import { useState } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  card: '#141414', border: '#2A2A2A', divider: '#1E1E1E',
  primary: '#F0EEE9', secondary: '#888780', muted: '#3A3835', accent: '#4A90D9',
}

export default function SupportChat() {
  const [open, setOpen]       = useState(false)
  const [name, setName]       = useState("Mario's Trattoria")
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSend() {
    if (!message.trim() || sending) return

    if (!supabase) {
      setError('Supabase is not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.')
      return
    }

    setSending(true)
    setError('')
    try {
      // 1. Save to Supabase
      const { data, error: dbErr } = await supabase
        .from('messages')
        .insert({ restaurant_name: name.trim(), message: message.trim() })
        .select('id')
        .single()

      if (dbErr) throw new Error(dbErr.message)

      // 2. Notify Discord
      const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `📨 New message from ${name.trim()}\n${message.trim()}\n\nReply ID: ${data.id}`,
          }),
        })
      }

      setSent(true)
      setMessage('')
    } catch (e) {
      setError(e.message || 'Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setTimeout(() => { setSent(false); setError('') }, 300)
  }

  const canSend = message.trim() && !sending

  return (
    <>
      {/* Popup */}
      {open && (
        <div
          style={{
            position: 'fixed', bottom: 80, right: 24, width: 308, zIndex: 50,
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
            animation: 'chatPopIn 0.16s ease-out',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '13px 16px', borderBottom: `1px solid ${C.divider}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                backgroundColor: 'rgba(74,144,217,0.1)',
                border: '1px solid rgba(74,144,217,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>
                Message AutoPilot Support
              </span>
            </div>
            <button
              onClick={handleClose}
              style={{ color: C.muted, fontSize: 18, lineHeight: 1, padding: '2px 4px', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.secondary}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 16 }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '18px 0' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', margin: '0 auto 12px',
                  backgroundColor: 'rgba(74,222,128,0.08)',
                  border: '1px solid rgba(74,222,128,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 4 }}>Message sent!</p>
                <p style={{ fontSize: 12, color: C.secondary, lineHeight: 1.5 }}>
                  We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: C.secondary, marginBottom: 5 }}>
                    Restaurant name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full outline-none"
                    style={{
                      fontSize: 13, padding: '7px 11px', borderRadius: 6,
                      backgroundColor: '#0F0F0F', color: C.primary,
                      border: `1px solid ${C.border}`,
                    }}
                    onFocus={e => e.target.style.borderColor = C.secondary}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>

                <div style={{ marginBottom: error ? 8 : 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: C.secondary, marginBottom: 5 }}>
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="How can we help?"
                    className="w-full outline-none resize-none"
                    style={{
                      fontSize: 13, padding: '7px 11px', borderRadius: 6,
                      backgroundColor: '#0F0F0F', color: C.primary,
                      border: `1px solid ${C.border}`,
                    }}
                    onFocus={e => e.target.style.borderColor = C.secondary}
                    onBlur={e => e.target.style.borderColor = C.border}
                    onKeyDown={e => e.key === 'Enter' && e.metaKey && handleSend()}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 11, color: '#f87171', marginBottom: 10 }}>{error}</p>
                )}

                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  style={{
                    width: '100%', padding: '8px 0', borderRadius: 6, border: 'none',
                    backgroundColor: canSend ? C.accent : 'rgba(74,144,217,0.35)',
                    color: canSend ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: 13, fontWeight: 600,
                    cursor: canSend ? 'pointer' : 'default',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => (open ? handleClose() : setOpen(true))}
        title={open ? 'Close' : 'Contact support'}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          width: 46, height: 46, borderRadius: '50%',
          backgroundColor: C.card, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.55)',
          transition: 'border-color 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#3A3835'
          e.currentTarget.style.transform = 'scale(1.06)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = C.border
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        {open ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F0EEE9" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F0EEE9" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        )}
      </button>
    </>
  )
}
