import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useDashboard } from '../DashboardContext'
import { useApp } from '../AppContext'
import { useDashboardReveal } from '../revealContext'
import { getPlanMeta } from '../planMeta'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const today    = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const hour     = new Date().getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

const TYPE_MAP = {
  review_replied: { type: 'review', text: 'Review replied' },
  post_scheduled: { type: 'post',   text: 'Post scheduled' },
}
const typeColor = { review: 'var(--ap-accent)', post: '#a78bfa', message: 'var(--ap-success)' }

function FeedIcon({ type }) {
  if (type === 'review') return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.128L8 10.5l-3.708 2.08L5 8.452 2 5.528l4.146-.772L8 1z"/>
    </svg>
  )
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12.5" cy="3.5" r="1.5"/><circle cx="12.5" cy="12.5" r="1.5"/>
      <circle cx="3.5" cy="8" r="1.5"/>
      <line x1="5" y1="8" x2="11" y2="4.2"/><line x1="5" y1="8" x2="11" y2="11.8"/>
    </svg>
  )
}

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
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        className="mb-4" style={{ color: C.muted }}>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <p className="text-sm font-medium text-center" style={{ color: C.secondary }}>No activity yet</p>
      <p className="text-xs text-center mt-1" style={{ color: C.muted, lineHeight: 1.6 }}>AutoPilot will show live updates here as reviews come in.</p>
    </div>
  )
}

export default function Overview() {
  const { events } = useDashboard()
  const { C, restaurantName, userId, plan } = useApp()
  const navigate = useNavigate()
  const revealed = useDashboardReveal()

  const planMeta  = getPlanMeta(plan)
  const planPillLabel = planMeta.key === 'pro' ? 'AutoPilot Pro' : `${planMeta.label} Plan`

  const [reviews,  setReviews]  = useState([])
  const [activity, setActivity] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  async function fetchData() {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return }
    if (!userId) { setLoading(false); return }
    try {
      const [revRes, actRes] = await Promise.all([
        supabase.from('reviews').select('*')
          .eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('activity_feed').select('*')
          .eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      ])

      console.group('[Overview] Supabase fetch for user', userId)
      console.log('reviews:', revRes.error ? `ERROR ${revRes.error.message}` : `${revRes.data?.length ?? 0} rows`, revRes.data)
      console.log('activity_feed:', actRes.error ? `ERROR ${actRes.error.message}` : `${actRes.data?.length ?? 0} rows`, actRes.data)
      const acts = actRes.data ?? []
      console.log('activity_feed types:', acts.reduce((m, a) => { m[a.type ?? '(null)'] = (m[a.type ?? '(null)'] || 0) + 1; return m }, {}))
      console.groupEnd()

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

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => { if (events.length > 0) fetchData() }, [events.length])

  const reviewRating = r => Number(r.rating) || parseInt(r.star_rating) || 0

  const repliedCount   = reviews.filter(r => (r.status || 'replied') === 'replied').length
  const postsScheduled = activity.filter(a => a.type === 'post_scheduled').length

  const ratedReviews = reviews.filter(r => reviewRating(r) > 0)
  const avgRating = ratedReviews.length
    ? (ratedReviews.reduce((s, r) => s + reviewRating(r), 0) / ratedReviews.length).toFixed(1)
    : '0'

  const statCards = [
    { label: 'Reviews replied', value: repliedCount,   path: '/dashboard/reviews'   },
    { label: 'Posts scheduled', value: postsScheduled, path: '/dashboard/posts'     },
    { label: 'Avg rating',      value: avgRating,      path: '/dashboard/analytics' },
  ]

  const feed = [
    ...reviews.map(r => ({
      type:   'review',
      text:   'Review replied',
      detail: [r.customer_name || r.reviewer_name, r.review_text || r.review].filter(Boolean).join(' · ') || '—',
      ts:     r.created_at,
    })),
    ...activity.map(a => {
      const mapped = TYPE_MAP[a.type] ?? { type: 'post', text: a.type }
      return {
        type:   mapped.type,
        text:   mapped.text,
        detail: a.description || '—',
        ts:     a.created_at,
      }
    }),
  ]
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 12)
    .map((item, i) => ({ ...item, time: relativeTime(item.ts), newest: i === 0 }))

  return (
    <div className="ap-page px-8 py-8" style={{ maxWidth: 1100 }}>

      {/* Status bar */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 mb-8"
        style={{
          backgroundColor: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, width: 'fit-content',
          opacity: revealed ? 1 : 0,
          transition: `opacity 500ms ${EASE}`,
        }}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0 pulse-dot"
          style={{ backgroundColor: 'var(--ap-accent)', display: 'inline-block' }} />
        <span style={{ fontSize: 12, color: C.secondary }}>
          {loading ? 'Loading…' : 'AutoPilot is running'}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4" style={{
        opacity: revealed ? 1 : 0,
        transition: `opacity 500ms ${EASE}`,
        transitionDelay: revealed ? '50ms' : '0ms',
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1, color: C.primary, marginBottom: 6 }}>
            {greeting}, {restaurantName}
          </h1>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{today}</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/subscription')}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold rounded-full"
          style={{
            padding: '6px 13px',
            background: planMeta.pillBg,
            color: planMeta.color,
            border: `1px solid ${planMeta.pillBorder}`,
            cursor: 'pointer',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          title="Manage subscription"
        >
          {planMeta.emoji && <span>{planMeta.emoji}</span>}
          {planPillLabel}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '11px 16px', borderRadius: 8, marginBottom: 14,
          backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {statCards.map((s, index) => (
          <button
            key={s.label}
            onClick={() => s.path && navigate(s.path)}
            disabled={!s.path}
            className="px-6 py-6 text-left w-full"
            style={{
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: C.card, border: `1px solid ${C.border}`,
              borderRadius: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)',
              backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
              cursor: s.path ? 'pointer' : 'default',
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(12px)',
              transition: `border-color 150ms, opacity 600ms ${EASE}, transform 600ms ${EASE}`,
              transitionDelay: revealed ? `${index * 80}ms` : '0ms',
            }}
            onMouseEnter={e => { if (s.path) e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)' }}
            onMouseLeave={e => { if (s.path) e.currentTarget.style.borderColor = C.border }}
          >
            {/* Cyan gradient overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(34,211,238,0.07) 0%, transparent 65%)',
            }} />
            <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: C.primary, fontFamily: 'var(--font-display)', marginBottom: 10 }}>
              {s.value}
            </p>
            <p style={{ fontSize: 13, color: C.secondary, fontWeight: 450, lineHeight: 1.6 }}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Activity feed */}
      <div style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: 'hidden',
        backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)',
        opacity: revealed ? 1 : 0,
        transition: `opacity 500ms ${EASE}`,
        transitionDelay: revealed ? '350ms' : '0ms',
      }}>
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${C.divider}` }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.muted, margin: 0 }}>
            Recent Activity
          </h2>
          {feed.length > 0 && (
            <span className="text-[11px] flex items-center gap-1.5" style={{ color: C.secondary }}>
              <span className="w-1.5 h-1.5 rounded-full pulse-dot"
                style={{ backgroundColor: 'var(--ap-success)', display: 'inline-block' }} />
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
                className="flex items-center gap-3"
                style={{
                  borderBottom: i < feed.length - 1 ? `1px solid ${C.divider}` : 'none',
                  padding: '12px 20px',
                  opacity: revealed ? 1 : 0,
                  transition: `opacity 500ms ${EASE}`,
                  transitionDelay: revealed ? `${400 + i * 50}ms` : '0ms',
                }}
              >
                {/* Left accent bar */}
                <div style={{
                  width: 3, alignSelf: 'stretch', borderRadius: 2, flexShrink: 0, minHeight: 24,
                  backgroundColor: typeColor[item.type] || C.muted,
                  opacity: 0.85,
                }} />

                {/* Icon chip */}
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: item.type === 'review' ? 'rgba(34,211,238,0.1)' : 'rgba(167,139,250,0.1)',
                  color: typeColor[item.type] || C.muted,
                }}>
                  <FeedIcon type={item.type} />
                </div>

                <div className="flex-1 min-w-0">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.primary, whiteSpace: 'nowrap' }}>{item.text}</span>
                    {item.newest && (
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ap-accent)', textTransform: 'uppercase' }}>New</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: C.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', lineHeight: 1.6 }}>
                    {item.detail}
                  </span>
                </div>

                <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
