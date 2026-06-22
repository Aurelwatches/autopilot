import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../AppContext'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

const TYPE_META = {
  failed_auth:      { label: 'Failed Auth',        color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: '🔐' },
  webhook_rejected: { label: 'Fake Webhook',        color: '#F97316', bg: 'rgba(249,115,22,0.1)',  icon: '🚨' },
  rate_limited:     { label: 'Rate Limited',        color: '#EAB308', bg: 'rgba(234,179,8,0.1)',   icon: '⚡' },
  suspicious_input: { label: 'Suspicious Input',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',  icon: '💉' },
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString()
}

export default function Security() {
  const { C } = useApp()
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [timeframe, setTimeframe] = useState('24h')
  const [filter, setFilter]     = useState('all')
  const API = import.meta.env.VITE_API_URL || 'https://autopilot-production-7671.up.railway.app'

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const hours = timeframe === '1h' ? 1 : timeframe === '6h' ? 6 : timeframe === '24h' ? 24 : 168
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      const res = await fetch(`${API}/api/security-events?since=${encodeURIComponent(since)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setEvents(data)
    } catch (e) {
      console.error('Security events fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [API, timeframe])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  // Stats
  const counts = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1
    return acc
  }, {})

  // Top attacking IPs
  const ipCounts = events.reduce((acc, e) => {
    if (e.ip && e.ip !== 'unknown') acc[e.ip] = (acc[e.ip] || 0) + 1
    return acc
  }, {})
  const topIPs = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const allClear = events.length === 0

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1000, margin: '0 auto' }} aria-label="Security monitoring">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.primary, margin: 0, letterSpacing: '-0.02em' }}>
            Security
          </h1>
          <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>
            Real-time intrusion detection — failed logins, fake webhooks, and attack patterns.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Timeframe */}
          {['1h','6h','24h','7d'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              aria-pressed={timeframe === tf}
              style={{
                fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${timeframe === tf ? 'var(--ap-accent)' : C.border}`,
                backgroundColor: timeframe === tf ? 'rgba(34,211,238,0.1)' : 'transparent',
                color: timeframe === tf ? 'var(--ap-accent)' : C.muted,
                transition: 'all 150ms',
              }}
            >{tf}</button>
          ))}
          <button
            onClick={fetchEvents}
            aria-label="Refresh security events"
            style={{
              fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${C.border}`, backgroundColor: 'transparent', color: C.secondary,
              transition: 'all 150ms',
            }}
          >↻ Refresh</button>
        </div>
      </div>

      {/* All-clear banner */}
      {!loading && allClear && (
        <div style={{
          padding: '20px 24px', borderRadius: 14, marginBottom: 28,
          backgroundColor: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }} role="status" aria-live="polite">
          <span style={{ fontSize: 24 }}>✅</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: '#22C55E', fontSize: 14 }}>All clear</p>
            <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>No suspicious activity detected in the last {timeframe}.</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <div
            key={type}
            style={{
              padding: '16px 20px', borderRadius: 14,
              backgroundColor: C.card, border: `1px solid ${C.border}`,
              cursor: 'pointer',
              outline: filter === type ? `2px solid ${meta.color}` : 'none',
              outlineOffset: 2,
              transition: 'outline 100ms',
            }}
            onClick={() => setFilter(filter === type ? 'all' : type)}
            role="button"
            tabIndex={0}
            aria-pressed={filter === type}
            aria-label={`Filter by ${meta.label}: ${counts[type] || 0} events`}
            onKeyDown={e => e.key === 'Enter' && setFilter(filter === type ? 'all' : type)}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>{meta.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: counts[type] ? meta.color : C.muted, marginBottom: 2 }}>
              {counts[type] || 0}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>{meta.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: topIPs.length ? '1fr 260px' : '1fr', gap: 20 }}>
        {/* Event log */}
        <section aria-label="Security event log">
          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('all')}
              aria-pressed={filter === 'all'}
              style={{
                fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${filter === 'all' ? 'var(--ap-accent)' : C.border}`,
                backgroundColor: filter === 'all' ? 'rgba(34,211,238,0.1)' : 'transparent',
                color: filter === 'all' ? 'var(--ap-accent)' : C.muted,
              }}
            >All</button>
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => setFilter(filter === type ? 'all' : type)}
                aria-pressed={filter === type}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${filter === type ? meta.color : C.border}`,
                  backgroundColor: filter === type ? meta.bg : 'transparent',
                  color: filter === type ? meta.color : C.muted,
                }}
              >{meta.icon} {meta.label}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontSize: 14 }} aria-live="polite">Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontSize: 14 }}>No events for this filter.</div>
          ) : (
            <div style={{
              borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${C.border}`,
              backgroundColor: C.card,
            }} role="log" aria-label="Security events" aria-live="polite">
              {filtered.map((ev, i) => {
                const meta = TYPE_META[ev.type] || { label: ev.type, color: C.muted, bg: 'transparent', icon: '⚠️' }
                return (
                  <div
                    key={ev.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: i < filtered.length - 1 ? `1px solid ${C.divider}` : 'none',
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 16, marginTop: 1, flexShrink: 0 }} aria-hidden="true">{meta.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                          backgroundColor: meta.bg, color: meta.color, letterSpacing: '0.03em',
                        }}>{meta.label}</span>
                        <code style={{ fontSize: 11, color: C.secondary, background: C.inputBg, padding: '1px 6px', borderRadius: 4 }}>
                          {ev.ip}
                        </code>
                        <span style={{ fontSize: 11, color: C.muted }}>{ev.path}</span>
                      </div>
                      {ev.details && Object.keys(ev.details).length > 0 && (
                        <p style={{ fontSize: 11, color: C.muted, margin: '4px 0 0', fontFamily: 'monospace' }}>
                          {JSON.stringify(ev.details)}
                        </p>
                      )}
                    </div>
                    <time
                      dateTime={ev.created_at}
                      style={{ fontSize: 11, color: C.muted, flexShrink: 0, whiteSpace: 'nowrap' }}
                      title={new Date(ev.created_at).toLocaleString()}
                    >
                      {timeAgo(ev.created_at)}
                    </time>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Top IPs panel */}
        {topIPs.length > 0 && (
          <aside aria-label="Top attacking IPs">
            <div style={{
              borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${C.border}`,
              backgroundColor: C.card,
              padding: '16px 20px',
            }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: C.primary, margin: '0 0 14px', letterSpacing: '-0.01em' }}>
                Top Offending IPs
              </h2>
              {topIPs.map(([ip, count]) => (
                <div key={ip} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: `1px solid ${C.divider}`,
                }}>
                  <code style={{ fontSize: 12, color: C.secondary, fontFamily: 'monospace' }}>{ip}</code>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                    backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444',
                  }}>{count}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: C.muted, margin: '12px 0 0', lineHeight: 1.5 }}>
                You'll get an email + Discord alert when an IP hits 5+ failed auths in 5 minutes.
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
