import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from './AppContext'

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function rowToEvents(row) {
  const evts = [{ type: 'sent', text: row.message, time: row.created_at, id: row.id }]
  if (row.reply) {
    evts.push({ type: 'reply', text: row.reply, time: row.replied_at || row.created_at, id: `${row.id}_r` })
  }
  return evts
}

export default function SupportChat() {
  const { C, theme, restaurantName, userId } = useApp()
  const [open, setOpen]         = useState(false)
  const [rows, setRows]         = useState([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending]   = useState(false)
  const [justSent, setJustSent] = useState(false)
  const [error, setError]       = useState('')
  const bottomRef               = useRef(null)
  const didInitialScroll        = useRef(false)

  const chatEvents = rows
    .flatMap(rowToEvents)
    .sort((a, b) => new Date(a.time) - new Date(b.time))

  async function fetchMessages() {
    if (!supabase || !userId) return
    const q = supabase.from('messages').select('*').order('created_at', { ascending: true })
    const { data } = userId ? await q.eq('user_id', userId) : await q
    if (data) setRows(data)
  }

  useEffect(() => {
    if (!open) return
    fetchMessages()
    const id = setInterval(fetchMessages, 12000)
    return () => clearInterval(id)
  }, [open])

  useEffect(() => {
    if (chatEvents.length === 0) return
    bottomRef.current?.scrollIntoView({
      behavior: didInitialScroll.current ? 'smooth' : 'instant',
    })
    didInitialScroll.current = true
  }, [chatEvents.length])

  function handleOpen() {
    didInitialScroll.current = false
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setError('')
  }

  async function handleSend() {
    if (!inputText.trim() || sending) return
    if (!supabase) { setError('Supabase not configured.'); return }

    setSending(true)
    setError('')
    const text = inputText.trim()
    setInputText('')

    try {
      const { data, error: dbErr } = await supabase
        .from('messages')
        .insert({ restaurant_name: restaurantName, message: text, user_id: userId })
        .select('id')
        .single()
      if (dbErr) throw new Error(dbErr.message)

      const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `📨 New message from ${restaurantName}\n${text}\n\nReply ID: ${data.id}`,
          }),
        })
      }

      setJustSent(true)
      setTimeout(() => setJustSent(false), 2000)
      await fetchMessages()
    } catch (e) {
      setError(e.message || 'Failed to send.')
      setInputText(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* ── Conversation popover ─────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24, width: 360, height: 500,
          zIndex: 50, display: 'flex', flexDirection: 'column',
          backgroundColor: C.card, border: `1px solid ${C.border}`,
          borderRadius: 14, boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
          animation: 'chatPopIn 0.16s ease-out',
        }}>

          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${C.divider}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                backgroundColor: '#4ade80',
                boxShadow: '0 0 0 2px rgba(74,222,128,0.18)',
              }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: C.primary }}>
                AutoPilot Support
              </span>
            </div>
            <button
              onClick={handleClose}
              style={{ color: C.muted, fontSize: 18, lineHeight: 1, padding: '2px 5px', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.secondary}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}
            >×</button>
          </div>

          {/* Messages */}
          <div
            className={theme === 'light' ? 'chat-scroll-light' : 'chat-scroll'}
            style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 4px' }}
          >
            {chatEvents.length === 0 ? (
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.muted}
                  strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <p style={{ fontSize: 12, color: C.secondary, margin: 0 }}>No messages yet.</p>
                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Send a message below to start.</p>
              </div>
            ) : (
              <>
                {chatEvents.map(evt => {
                  const isSent = evt.type === 'sent'
                  return (
                    <div key={evt.id} style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: isSent ? 'flex-start' : 'flex-end',
                      marginBottom: 10,
                    }}>
                      <div style={{
                        maxWidth: '74%', padding: '8px 12px',
                        borderRadius: isSent ? '3px 12px 12px 12px' : '12px 3px 12px 12px',
                        backgroundColor: isSent ? C.sentBubble : 'rgba(74,144,217,0.11)',
                        border: isSent
                          ? `1px solid ${C.border}`
                          : '1px solid rgba(74,144,217,0.22)',
                      }}>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: C.primary }}>
                          {evt.text}
                        </p>
                      </div>
                      <span style={{ fontSize: 10, marginTop: 3, color: C.muted,
                        paddingLeft: isSent ? 2 : 0, paddingRight: isSent ? 0 : 2 }}>
                        {isSent ? formatTime(evt.time) : `AutoPilot · ${formatTime(evt.time)}`}
                      </span>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 14px 14px', borderTop: `1px solid ${C.divider}`, flexShrink: 0,
          }}>
            {justSent && (
              <p style={{ fontSize: 11, color: '#4ade80', marginBottom: 6, margin: '0 0 6px' }}>
                ✓ Message sent
              </p>
            )}
            {error && (
              <p style={{ fontSize: 11, color: '#f87171', marginBottom: 6, margin: '0 0 6px' }}>
                {error}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: justSent || error ? 0 : 0 }}>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a message…"
                style={{
                  flex: 1, fontSize: 13, padding: '8px 11px', borderRadius: 8,
                  backgroundColor: C.inputBg, color: C.primary,
                  border: `1px solid ${C.border}`, outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = C.secondary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none', flexShrink: 0,
                  backgroundColor: (inputText.trim() && !sending) ? C.accent : 'rgba(74,144,217,0.35)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: (inputText.trim() && !sending) ? 'pointer' : 'default',
                  transition: 'background-color 0.15s',
                }}
              >
                {sending ? '…' : '→'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating bubble ──────────────────────────────────────── */}
      <button
        onClick={() => open ? handleClose() : handleOpen()}
        title={open ? 'Close' : 'Message support'}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          width: 46, height: 46, borderRadius: '50%',
          backgroundColor: C.card, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'border-color 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = C.secondary
          e.currentTarget.style.transform = 'scale(1.06)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = C.border
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        {open ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        )}
      </button>
    </>
  )
}
