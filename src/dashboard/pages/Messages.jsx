import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'

const RESTAURANT = "Mario's Trattoria"

const C = {
  card: '#0E1420', border: '#2E2A24', divider: '#211E19',
  primary: '#EAF2FF', secondary: '#94A3B8', muted: '#5B6678', accent: '#22D3EE',
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDateLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString())     return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export default function Messages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const containerRef            = useRef(null)
  const bottomRef               = useRef(null)
  const initialLoad             = useRef(true)

  // Flatten each DB row into ordered chat events (sent message + optional reply)
  const chatEvents = useMemo(() => {
    const evts = []
    for (const msg of messages) {
      evts.push({ type: 'sent',  text: msg.message, time: msg.created_at,            id: msg.id })
      if (msg.reply) {
        evts.push({ type: 'reply', text: msg.reply,   time: msg.replied_at ?? msg.created_at, id: `${msg.id}_r` })
      }
    }
    return evts.sort((a, b) => new Date(a.time) - new Date(b.time))
  }, [messages])

  // Scroll to bottom on initial load (instant) or when new events arrive and user is near bottom
  useEffect(() => {
    if (chatEvents.length === 0) return
    const el = containerRef.current
    const nearBottom = !el || (el.scrollHeight - el.scrollTop - el.clientHeight < 120)
    if (initialLoad.current || nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: initialLoad.current ? 'instant' : 'smooth' })
    }
    initialLoad.current = false
  }, [chatEvents])

  async function fetchMessages() {
    if (!supabase) {
      setError('Supabase is not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.')
      setLoading(false)
      return
    }
    try {
      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .eq('restaurant_name', RESTAURANT)
        .order('created_at', { ascending: true })
      if (err) throw err
      setMessages(data ?? [])
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load messages.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    const id = setInterval(fetchMessages, 15000)
    return () => clearInterval(id)
  }, [])

  // Build bubble list with date separators inserted between days
  function buildBubbles() {
    const nodes = []
    let lastDateLabel = null

    for (const evt of chatEvents) {
      const label = formatDateLabel(evt.time)
      if (label !== lastDateLabel) {
        lastDateLabel = label
        nodes.push(
          <div key={`sep-${evt.time}`} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            margin: '20px 0 12px',
          }}>
            <div style={{ flex: 1, height: 1, backgroundColor: C.divider }} />
            <span style={{ fontSize: 10, color: C.muted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {label}
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: C.divider }} />
          </div>
        )
      }

      const isSent = evt.type === 'sent'
      nodes.push(
        <div key={evt.id} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isSent ? 'flex-start' : 'flex-end',
          marginBottom: 10,
        }}>
          <div style={{
            maxWidth: '68%',
            padding: '9px 14px',
            borderRadius: isSent ? '3px 14px 14px 14px' : '14px 3px 14px 14px',
            backgroundColor: isSent ? '#1D1D1D' : 'rgba(34,211,238,0.11)',
            border: isSent
              ? `1px solid ${C.border}`
              : '1px solid rgba(34,211,238,0.22)',
          }}>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: C.primary }}>
              {evt.text}
            </p>
          </div>
          <span style={{
            fontSize: 10, marginTop: 3, color: C.muted,
            paddingLeft: isSent ? 2 : 0,
            paddingRight: isSent ? 0 : 2,
          }}>
            {isSent ? formatTime(evt.time) : `AutoPilot · ${formatTime(evt.time)}`}
          </span>
        </div>
      )
    }

    return nodes
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', padding: '32px 32px 0',
    }}>

      {/* Page header */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: C.primary, marginBottom: 3 }}>Messages</h1>
        <p style={{ fontSize: 13, color: C.secondary }}>Support conversations for {RESTAURANT}</p>
      </div>

      {error && (
        <div style={{
          padding: '11px 16px', borderRadius: 8, marginBottom: 14, flexShrink: 0,
          backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Chat window — fills remaining height, flush to bottom of viewport */}
      <div style={{
        flex: 1, minHeight: 0,
        border: `1px solid ${C.border}`, borderBottom: 'none',
        borderRadius: '10px 10px 0 0',
        backgroundColor: C.card,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Chat header bar */}
        <div style={{
          padding: '13px 20px',
          borderBottom: `1px solid ${C.divider}`,
          display: 'flex', alignItems: 'center', gap: 9,
          flexShrink: 0,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: '#22D3EE',
            boxShadow: '0 0 0 2px rgba(34,211,238,0.18)',
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{RESTAURANT}</span>
          <span style={{ fontSize: 11, color: C.muted }}>with AutoPilot Support</span>
        </div>

        {/* Scrollable message area */}
        <div ref={containerRef} style={{
          flex: 1, overflowY: 'auto',
          padding: '4px 20px 24px',
        }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: C.muted }}>Loading…</p>
            </div>
          ) : chatEvents.length === 0 && !error ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', paddingTop: 80,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
                style={{ color: C.muted, marginBottom: 12 }}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>No messages yet.</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                Use the chat bubble in the corner to get started.
              </p>
            </div>
          ) : (
            <>
              {buildBubbles()}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
