import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useDashboard } from '../DashboardContext'
import { useApp } from '../AppContext'

const today    = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const hour     = new Date().getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

const TYPE_MAP = {
  review_replied: { type: 'review',   text: 'Review replied' },
  post_scheduled: { type: 'post',     text: 'Post scheduled' },
  follow_up_sent: { type: 'followup', text: 'Follow-up sent' },
}
const typeColor = { review: '#4A90D9', post: '#a78bfa', followup: '#4ade80' }
const typeLabel = { review: 'R', post: 'P', followup: 'F' }

function relativeTime(iso) {
  const secs = (Date.now() - new Date(iso)) / 1000
  if (secs < 60)     return 'Just now'
  if (secs < 3600)   return `${Math.floor(secs / 60)} min ago`
  if (secs < 86400)  return `${Math.floor(secs / 3600)} hr ago`
  if (secs < 172800) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function EmptyFeed({ C }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        className="mb-4" style={{ color: C.muted }}>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <p className="text-sm text-center" style={{ color: C.secondary }}>No activity yet.</p>
      <p className="text-xs text-center mt-1" style={{ color: C.muted }}>AutoPilot will show live updates here.</p>
    </div>
  )
}

export default function Overview() {
  const { events } = useDashboard()
  const { C, restaurantName, userId } = useApp()
  const navigate = useNavigate()

  const [reviews,  setReviews]  = useState([])
  const [activity, setActivity] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  async function fetchData() {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return }
    // Wait for auth to resolve — fetching before userId exists would either
    // return nothing under RLS or pull other accounts' data.
    if (!userId) { setLoading(false); return }
    try {
      const [revRes, actRes] = await Promise.all([
        supabase.from('reviews').select('*')
          .eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('activity_feed').select('*')
          .eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      ])
      if (revRes.error) throw revRes.error
      if (actRes.error) throw actRes.error
      setReviews(revRes.data ?? [])
      setActivity(actRes.data ?? [])
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch when auth resolves (userId null → real id) and poll every 30s
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [userId])

  // Instant refresh when an event streams in over SSE
  useEffect(() => { if (events.length > 0) fetchData() }, [events.length])

  // ── Stats from real Supabase data ─────────────────────────────────────────
  const repliedCount   = reviews.filter(r => (r.status ?? 'replied') === 'replied').length
  const postsScheduled = activity.filter(a => a.type === 'post_scheduled').length
  const textsSent      = activity.filter(a => a.type === 'follow_up_sent').length

  const ratedReviews = reviews.filter(r => Number(r.rating) > 0)
  const avgRating = ratedReviews.length
    ? (ratedReviews.reduce((s, r) => s + Number(r.rating), 0) / ratedReviews.length).toFixed(1)
    : '0'

  const statCards = [
    { label: 'Reviews Replied', value: repliedCount,   path: '/dashboard/reviews'   },
    { label: 'Posts Scheduled', value: postsScheduled, path: '/dashboard/posts'     },
    { label: 'Texts Sent',      value: textsSent,      path: null                   }, // no follow-ups page
    { label: 'Avg Rating',      value: avgRating,      path: '/dashboard/analytics' },
  ]

  // Recent activity: activity_feed rows plus review replies, newest first.
  // Reviews land in their own table, so we merge them in to keep the feed useful.
  const feed = [
    ...reviews.map(r => ({
      type:   'review',
      text:   'Review replied',
      detail: [r.customer_name, r.review_text].filter(Boolean).join(' · ') || '—',
      ts:     r.created_at,
    })),
    ...activity.map(a => {
      const mapped = TYPE_MAP[a.type] ?? { type: 'post', text: a.type }
      return {
        type:   mapped.type,
        text:   mapped.text,
        detail: [a.platform, a.details].filter(Boolean).join(' · ') || '—',
        ts:     a.created_at,
      }
    }),
  ]
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 12)
    .map((item, i) => ({ ...item, time: relativeTime(item.ts), newest: i === 0 }))

  const totalTracked = reviews.length + activity.length

  return (
    <div className="px-8 py-8" style={{ maxWidth: 1100 }}>

      {/* Status bar */}
      <div className="flex items-center gap-3 rounded px-4 py-3 mb-8 text-sm"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <span className="w-2 h-2 rounded-full shrink-0 pulse-dot"
          style={{ backgroundColor: '#4ade80', display: 'inline-block' }} />
        <span style={{ color: C.primary }}>AutoPilot is running</span>
        <span style={{ color: C.muted }}>·</span>
        <span style={{ color: C.secondary }}>
          {loading
            ? 'Loading…'
            : totalTracked > 0
              ? `${totalTracked} event${totalTracked !== 1 ? 's' : ''} tracked`
              : 'Waiting for first event'}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: C.primary }}>
          {greeting}, {restaurantName}
        </h1>
        <p className="text-sm" style={{ color: C.secondary }}>{today}</p>
      </div>

      {error && (
        <div style={{
          padding: '11px 16px', borderRadius: 8, marginBottom: 14,
          backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Stat cards — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <button
            key={s.label}
            onClick={() => s.path && navigate(s.path)}
            disabled={!s.path}
            className="rounded-lg px-5 py-5 text-left w-full transition-colors"
            style={{
              backgroundColor: C.card, border: `1px solid ${C.border}`,
              cursor: s.path ? 'pointer' : 'default',
            }}
            onMouseEnter={e => { if (s.path) e.currentTarget.style.borderColor = C.secondary }}
            onMouseLeave={e => { if (s.path) e.currentTarget.style.borderColor = C.border }}
          >
            <p className="text-[11px] font-medium uppercase tracking-widest mb-3"
              style={{ color: C.muted }}>{s.label}</p>
            <p className="text-3xl font-semibold tracking-tight mb-1"
              style={{ color: C.primary }}>{s.value}</p>
            {s.path && (
              <p className="text-xs flex items-center gap-1" style={{ color: C.muted }}>
                View →
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Activity feed */}
      <div className="rounded-lg overflow-hidden"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${C.divider}` }}>
          <h2 className="text-sm font-semibold" style={{ color: C.primary }}>Recent Activity</h2>
          {feed.length > 0 && (
            <span className="text-[11px] flex items-center gap-1.5" style={{ color: C.secondary }}>
              <span className="w-1.5 h-1.5 rounded-full pulse-dot"
                style={{ backgroundColor: '#4ade80', display: 'inline-block' }} />
              Live
            </span>
          )}
        </div>

        {loading && feed.length === 0 ? (
          <div className="flex justify-center py-16">
            <p className="text-sm" style={{ color: C.muted }}>Loading…</p>
          </div>
        ) : feed.length === 0 ? <EmptyFeed C={C} /> : (
          <div>
            {feed.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-5 py-3.5"
                style={{
                  borderBottom: i < feed.length - 1 ? `1px solid ${C.divider}` : 'none',
                  backgroundColor: item.newest ? 'rgba(74,222,128,0.03)' : 'transparent',
                }}
              >
                <div
                  className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: `${typeColor[item.type]}18`, color: typeColor[item.type] }}
                >
                  {typeLabel[item.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: C.primary }}>{item.text}</span>
                    {item.newest && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 pulse-dot"
                        style={{ backgroundColor: '#4ade80', display: 'inline-block' }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: C.secondary }}>{item.detail}</p>
                </div>
                <span className="text-xs shrink-0" style={{ color: C.muted }}>{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
