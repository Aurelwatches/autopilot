import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../AppContext'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

const API = import.meta.env.VITE_API_URL || 'https://autopilot-production-7671.up.railway.app'

const TYPE_META = {
  failed_auth:      { label: 'Failed Auth',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: '🔐' },
  webhook_rejected: { label: 'Fake Webhook',     color: '#F97316', bg: 'rgba(249,115,22,0.1)',  icon: '🚨' },
  rate_limited:     { label: 'Rate Limited',     color: '#EAB308', bg: 'rgba(234,179,8,0.1)',   icon: '⚡' },
  suspicious_input: { label: 'Suspicious Input', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',  icon: '💉' },
  probe_404:        { label: 'Path Probe / 404', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   icon: '🔍' },
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60)    return `${Math.round(diff)}s ago`
  if (diff < 3600)  return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString()
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || ''
}

export default function Security() {
  const { C } = useApp()
  const [events,      setEvents]      = useState([])
  const [blockedIPs,  setBlockedIPs]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [timeframe,   setTimeframe]   = useState('1h')
  const [filter,      setFilter]      = useState('all')
  const [blockingIP,  setBlockingIP]  = useState(null) // ip being blocked/unblocked
  const [lastRefresh, setLastRefresh] = useState(null)
  const intervalRef = useRef(null)

  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const token = await getToken()
      const hours = timeframe === '1h' ? 1 : timeframe === '6h' ? 6 : timeframe === '24h' ? 24 : 168
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      const res = await fetch(`${API}/api/security-events?since=${encodeURIComponent(since)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      setEvents(await res.json())
      setLastRefresh(new Date())
    } catch (e) {
      console.error('Security events fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  const fetchBlockedIPs = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API}/api/admin/blocked-ips`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setBlockedIPs(data.ips || [])
    } catch (e) { /* admin only */ }
  }, [])

  // Initial load + auto-refresh every 10s
  useEffect(() => {
    fetchEvents()
    fetchBlockedIPs()
    intervalRef.current = setInterval(() => {
      fetchEvents(true)
      fetchBlockedIPs()
    }, 10_000)
    return () => clearInterval(intervalRef.current)
  }, [fetchEvents, fetchBlockedIPs])

  async function blockIP(ip) {
    setBlockingIP(ip)
    try {
      const token = await getToken()
      await fetch(`${API}/api/admin/block-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ip, reason: 'manual' }),
      })
      await fetchBlockedIPs()
    } finally { setBlockingIP(null) }
  }

  async function unblockIP(ip) {
    setBlockingIP(ip)
    try {
      const token = await getToken()
      await fetch(`${API}/api/admin/unblock-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ip }),
      })
      await fetchBlockedIPs()
    } finally { setBlockingIP(null) }
  }

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  const counts = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1; return acc
  }, {})

  const ipCounts = events.reduce((acc, e) => {
    if (e.ip && e.ip !== 'unknown') acc[e.ip] = (acc[e.ip] || 0) + 1; return acc
  }, {})
  const topIPs = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const blockedIPSet = new Set(blockedIPs.map(b => (typeof b === 'string' ? b : b.ip)))
  const allClear = events.length === 0

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1060, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.primary, margin: 0, letterSpacing: '-0.02em' }}>Security</h1>
            {/* Live pulsing dot */}
            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                backgroundColor: allClear ? '#22C55E' : '#EF4444',
                animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                opacity: 0.6,
              }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: allClear ? '#22C55E' : '#EF4444' }} />
            </span>
          </div>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
            Real-time intrusion detection · auto-refreshes every 10s
            {lastRefresh && <span style={{ marginLeft: 8, fontSize: 11 }}>· last updated {timeAgo(lastRefresh)}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {['1h','6h','24h','7d'].map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={{
              fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${timeframe === tf ? 'var(--ap-accent)' : C.border}`,
              backgroundColor: timeframe === tf ? 'rgba(34,211,238,0.1)' : 'transparent',
              color: timeframe === tf ? 'var(--ap-accent)' : C.muted,
            }}>{tf}</button>
          ))}
          <button onClick={() => { fetchEvents(); fetchBlockedIPs() }} style={{
            fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${C.border}`, backgroundColor: 'transparent', color: C.secondary,
          }}>↻ Refresh</button>
        </div>
      </div>

      {/* All-clear */}
      {!loading && allClear && (
        <div style={{
          padding: '16px 20px', borderRadius: 12, marginBottom: 24,
          backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: '#22C55E', fontSize: 13 }}>All clear</p>
            <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>No suspicious activity in the last {timeframe}.</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 24 }}>
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <div key={type} onClick={() => setFilter(filter === type ? 'all' : type)}
            style={{
              padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
              backgroundColor: C.card, border: `1px solid ${filter === type ? meta.color : C.border}`,
              outline: filter === type ? `2px solid ${meta.color}` : 'none', outlineOffset: 2,
              transition: 'border-color 150ms',
            }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{meta.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: counts[type] ? meta.color : C.muted, marginBottom: 1 }}>{counts[type] || 0}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{meta.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: topIPs.length ? '1fr 280px' : '1fr', gap: 20 }}>

        {/* Event log */}
        <div>
          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {['all', ...Object.keys(TYPE_META)].map(t => {
              const meta = TYPE_META[t]
              const active = filter === t
              return (
                <button key={t} onClick={() => setFilter(t)} style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${active ? (meta?.color || 'var(--ap-accent)') : C.border}`,
                  backgroundColor: active ? (meta?.bg || 'rgba(34,211,238,0.1)') : 'transparent',
                  color: active ? (meta?.color || 'var(--ap-accent)') : C.muted,
                }}>{meta ? `${meta.icon} ${meta.label}` : 'All'}</button>
              )
            })}
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontSize: 14 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontSize: 13 }}>No events for this filter.</div>
          ) : (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, backgroundColor: C.card }}>
              {filtered.slice(0, 100).map((ev, i) => {
                const meta = TYPE_META[ev.type] || { label: ev.type, color: C.muted, bg: 'transparent', icon: '⚠️' }
                return (
                  <div key={ev.id} style={{
                    padding: '10px 14px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.divider}` : 'none',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{meta.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                        <code style={{ fontSize: 11, color: C.secondary, background: C.inputBg, padding: '1px 5px', borderRadius: 3 }}>{ev.ip}</code>
                        <span style={{ fontSize: 11, color: C.muted }}>{ev.path}</span>
                      </div>
                      {ev.details && Object.keys(ev.details).length > 0 && (
                        <p style={{ fontSize: 10, color: C.muted, margin: '3px 0 0', fontFamily: 'monospace' }}>{JSON.stringify(ev.details)}</p>
                      )}
                    </div>
                    <time style={{ fontSize: 10, color: C.muted, flexShrink: 0, whiteSpace: 'nowrap' }} title={new Date(ev.created_at).toLocaleString()}>
                      {timeAgo(ev.created_at)}
                    </time>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        {topIPs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Top attacking IPs + block buttons */}
            <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, backgroundColor: C.card, padding: '16px 18px' }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color: C.primary, margin: '0 0 12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Top Attacking IPs
              </h2>
              {topIPs.map(([ip, count]) => {
                const isBlocked = blockedIPSet.has(ip)
                const isBusy = blockingIP === ip
                return (
                  <div key={ip} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 0', borderBottom: `1px solid ${C.divider}`, gap: 8,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <code style={{ fontSize: 11, color: isBlocked ? '#EF4444' : C.secondary, fontFamily: 'monospace' }}>{ip}</code>
                      {isBlocked && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '1px 5px', borderRadius: 3 }}>BLOCKED</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 4, backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>{count}</span>
                      <button
                        onClick={() => isBlocked ? unblockIP(ip) : blockIP(ip)}
                        disabled={isBusy}
                        style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, cursor: isBusy ? 'default' : 'pointer',
                          border: `1px solid ${isBlocked ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                          backgroundColor: isBlocked ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                          color: isBlocked ? '#22C55E' : '#EF4444',
                          opacity: isBusy ? 0.5 : 1,
                        }}
                      >
                        {isBusy ? '…' : isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Currently blocked IPs */}
            {blockedIPs.length > 0 && (
              <div style={{ borderRadius: 12, border: '1px solid rgba(239,68,68,0.25)', backgroundColor: C.card, padding: '16px 18px' }}>
                <h2 style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', margin: '0 0 12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  🚫 Blocked IPs ({blockedIPs.length})
                </h2>
                {blockedIPs.slice(0, 10).map((row) => {
                  const ip = typeof row === 'string' ? row : row.ip
                  const reason = row.reason || 'manual'
                  const isBusy = blockingIP === ip
                  return (
                    <div key={ip} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 0', borderBottom: `1px solid ${C.divider}`, gap: 8,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <code style={{ fontSize: 11, color: '#EF4444', fontFamily: 'monospace' }}>{ip}</code>
                        <span style={{ marginLeft: 6, fontSize: 9, color: C.muted }}>{reason}</span>
                      </div>
                      <button
                        onClick={() => unblockIP(ip)}
                        disabled={isBusy}
                        style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, cursor: isBusy ? 'default' : 'pointer',
                          border: '1px solid rgba(34,197,94,0.4)', backgroundColor: 'rgba(34,197,94,0.08)', color: '#22C55E',
                          opacity: isBusy ? 0.5 : 1,
                        }}
                      >
                        {isBusy ? '…' : 'Unblock'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, margin: 0 }}>
              IPs are auto-blocked after <strong style={{ color: C.secondary }}>3 failed auth attempts</strong> or <strong style={{ color: C.secondary }}>6 path probes</strong> in 60 seconds. Blocks persist across server restarts.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
