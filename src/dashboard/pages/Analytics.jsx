import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '../../lib/supabase'
import { useApp } from '../AppContext'

// ── Date helpers ──────────────────────────────────────────────────────────────

function isoDay(d) { return d.toISOString().slice(0, 10) }

function rangeStart(range) {
  const d = new Date()
  if (range === '1d')  { d.setHours(0, 0, 0, 0); return d }
  if (range === '30d') d.setDate(d.getDate() - 30)
  if (range === '90d') d.setDate(d.getDate() - 90)
  if (range === '1y')  d.setFullYear(d.getFullYear() - 1)
  return d
}

// Returns 24 buckets "HH" for today's hours (00–23)
function todayHours() {
  return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
}

// "HH" from an ISO string
function hourOf(iso) { return iso.slice(11, 13) }

function lastNDays(n) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); days.push(isoDay(d))
  }
  return days
}

function weekOf(isoDate) {
  const d = new Date(isoDate); d.setDate(d.getDate() - d.getDay()); return isoDay(d)
}

function monthOf(isoDate) { return isoDate.slice(0, 7) }

function lastNWeeks(n) {
  const weeks = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i * 7); weeks.push(weekOf(isoDay(d)))
  }
  return [...new Set(weeks)]
}

function lastNMonths(n) {
  const months = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); months.push(monthOf(isoDay(d)))
  }
  return [...new Set(months)]
}

function shortLabel(key, range) {
  if (range === '1d') {
    const h = parseInt(key, 10)
    return h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`
  }
  if (range === '1y') return key.slice(5) // MM
  return key.slice(5)                     // MM-DD
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label, C }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: C.card, border: `1px solid ${C.border}`,
      backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
      boxShadow: C.cardShadow,
      borderRadius: 8, padding: '7px 11px', fontSize: 12,
    }}>
      <p style={{ color: C.secondary, marginBottom: 3 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: '#E8A020', fontWeight: 600, margin: 0 }}>
          {p.value}
        </p>
      ))}
    </div>
  )
}

// ── Chart card ────────────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, hasData, loading, C, children }) {
  return (
    <div style={{
      borderRadius: 16, marginBottom: 20,
      backgroundColor: C.card, border: `1px solid ${C.border}`,
      backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
      boxShadow: C.cardShadow,
      padding: '20px 24px',
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 2 }}>{title}</p>
      {subtitle && <p style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>{subtitle}</p>}
      {hasData ? children : (
        <div style={{
          height: 180, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {loading ? (
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Loading…</p>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.muted}
                strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
              </svg>
              <p style={{ fontSize: 12, color: C.secondary, margin: 0 }}>
                Not enough data yet — check back soon
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const RANGE_OPTIONS = [
  { value: '1d',  label: 'Today'        },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y',  label: 'Last year'    },
]

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const { C, theme, userId, plan } = useApp()
  const [reviews,    setReviews]    = useState([])
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [range,      setRange]      = useState('30d')

  const isStarter = plan === 'starter'

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    // Wait for auth to resolve so charts are filtered to the logged-in user
    // (fetching with userId null returns nothing under RLS and never refetched).
    if (!userId) { setLoading(false); return }

    function fetchData() {
      const reviewQ = supabase.from('reviews')
        .select('id, rating, status, created_at').eq('user_id', userId).order('created_at')
      const actQ = supabase.from('activity_feed')
        .select('id, type, created_at').eq('user_id', userId).order('created_at')
      Promise.all([reviewQ, actQ]).then(([r, a]) => {
        if (r.error) console.error('[Analytics] reviews fetch error:', r.error.message)
        if (a.error) console.error('[Analytics] activity_feed fetch error:', a.error.message)
        const revs = r.data ?? [], acts = a.data ?? []
        console.group('[Analytics] fetched for user', userId)
        console.log('reviews:', revs.length, revs)
        console.log('  with a numeric rating (>0):', revs.filter(x => Number(x.rating) > 0).length,
          '| null/0 rating:', revs.filter(x => !(Number(x.rating) > 0)).length)
        console.log('  replied:', revs.filter(x => x.status === 'replied').length)
        console.log('activity_feed:', acts.length, acts)
        console.log('  post_scheduled:', acts.filter(x => x.type === 'post_scheduled').length)
        console.groupEnd()
        setReviews(r.data ?? [])
        setActivities(a.data ?? [])
      }).catch(console.error).finally(() => setLoading(false))
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [userId])

  // Filter to selected range
  const cutoff = rangeStart(range)
  const filteredReviews    = reviews.filter(r => new Date(r.created_at) >= cutoff)
  const filteredActivities = activities.filter(a => new Date(a.created_at) >= cutoff)

  // ── Chart data (memoised) ─────────────────────────────────────────────────

  const { repliedData, postsData, ratingData } = useMemo(() => {
    const groupKey = range === '1d'  ? d => hourOf(d)
                   : range === '30d' ? d => isoDay(new Date(d))
                   : range === '90d' ? d => weekOf(d)
                   :                   d => monthOf(d)

    const buckets = range === '1d'  ? todayHours()
                  : range === '30d' ? lastNDays(30)
                  : range === '90d' ? lastNWeeks(13)
                  :                   lastNMonths(12)

    // Reviews replied per bucket
    const repliedCount = {}
    filteredReviews.forEach(r => {
      if (r.status === 'replied') {
        const k = groupKey(r.created_at)
        repliedCount[k] = (repliedCount[k] || 0) + 1
      }
    })
    const repliedData = buckets.map(b => ({
      date: shortLabel(b, range), count: repliedCount[b] || 0,
    }))

    // Posts per bucket
    const postCount = {}
    filteredActivities.forEach(a => {
      if (a.type === 'post_scheduled') {
        const k = groupKey(a.created_at)
        postCount[k] = (postCount[k] || 0) + 1
      }
    })
    const postsData = buckets.map(b => ({
      date: shortLabel(b, range), count: postCount[b] || 0,
    }))

    // Avg rating per bucket (only include buckets with data)
    const ratingGroups = {}
    filteredReviews.forEach(r => {
      if (r.rating == null) return
      const k = groupKey(r.created_at)
      if (!ratingGroups[k]) ratingGroups[k] = []
      ratingGroups[k].push(Number(r.rating))
    })
    const ratingData = buckets
      .filter(b => ratingGroups[b]?.length)
      .map(b => ({
        date: shortLabel(b, range),
        avg: Number((ratingGroups[b].reduce((s, v) => s + v, 0) / ratingGroups[b].length).toFixed(2)),
      }))

    return { repliedData, postsData, ratingData }
  }, [filteredReviews, filteredActivities, range])

  const repliedHasData = repliedData.filter(d => d.count > 0).length >= 1
  const postsHasData   = postsData.filter(d => d.count > 0).length >= 1
  const ratingHasData  = ratingData.length >= 1

  // Why each chart renders or shows "Not enough data yet" (needs >= 2 non-empty points)
  useEffect(() => {
    if (loading) return
    console.log(`[Analytics] chart readiness (range ${range}) —`,
      'reviewsReplied:', `${repliedData.filter(d => d.count > 0).length} pts → ${repliedHasData ? 'CHART' : 'empty'}`,
      '| postsScheduled:', `${postsData.filter(d => d.count > 0).length} pts → ${postsHasData ? 'CHART' : 'empty'}`,
      '| avgRating:', `${ratingData.length} pts → ${ratingHasData ? 'CHART' : 'empty'}`)
  }, [loading, range, repliedHasData, postsHasData, ratingHasData])

  // ── Stat cards ────────────────────────────────────────────────────────────

  const totalReplied = reviews.filter(r => r.status === 'replied').length
  const totalPosts   = activities.filter(a => a.type === 'post_scheduled').length
  const ratedReviews = reviews.filter(r => r.rating != null)
  const avgRating    = ratedReviews.length
    ? (ratedReviews.reduce((s, r) => s + Number(r.rating), 0) / ratedReviews.length).toFixed(1)
    : '—'

  const statCards = [
    { label: 'Reviews replied',   value: loading ? '—' : totalReplied },
    { label: 'Posts published',   value: loading ? '—' : totalPosts   },
    { label: 'Avg response time', value: '—'                           },
    { label: 'Avg rating',        value: loading ? '—' : avgRating    },
  ]

  const axisStyle  = { fontSize: 10, fill: C.muted }
  const gridStyle  = { stroke: C.divider, strokeDasharray: '3 3' }
  const ticks      = range === '1d' ? { interval: 5 } : range === '30d' ? { interval: 4 } : { interval: 2 }

  return (
    <div className="ap-page px-8 py-8" style={{ maxWidth: 1000 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: C.primary }}>Analytics</h1>
          <p className="text-sm" style={{ color: C.secondary }}>Performance over time</p>
        </div>

        {/* Range filter */}
        <div className="flex gap-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className="text-xs px-3 py-1.5 rounded transition-colors"
              style={{
                backgroundColor: range === opt.value ? C.primary : C.card,
                color:           range === opt.value ? (C.bg) : C.secondary,
                border:          `1px solid ${range === opt.value ? 'transparent' : C.border}`,
                fontWeight:      range === opt.value ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="px-5 py-5"
            style={{
              backgroundColor: C.card, border: `1px solid ${C.border}`,
              borderRadius: 16,
              backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
              boxShadow: C.cardShadow,
            }}>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-3"
              style={{ color: C.muted }}>{s.label}</p>
            <p className="text-3xl font-semibold tracking-tight" style={{ color: C.primary }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart 1 */}
      <ChartCard
        title="Reviews Replied"
        subtitle={range === '1d' ? 'By hour, today' : range === '30d' ? 'Per day, last 30 days' : range === '90d' ? 'Per week, last 90 days' : 'Per month, last year'}
        hasData={repliedHasData}
        loading={loading}
        C={C}
      >
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={repliedData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={axisStyle} {...ticks} />
            <YAxis tick={axisStyle} allowDecimals={false} />
            <Tooltip content={props => <DarkTooltip {...props} C={C} />} />
            <Line type="monotone" dataKey="count" stroke={C.primary}
              strokeWidth={1.8} dot={false} activeDot={{ r: 3, fill: '#E8A020' }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Chart 2 */}
      <ChartCard
        title="Posts Scheduled"
        subtitle={range === '1d' ? 'By hour, today' : range === '30d' ? 'Per week, last 30 days' : range === '90d' ? 'Per week, last 90 days' : 'Per month, last year'}
        hasData={postsHasData}
        loading={loading}
        C={C}
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={postsData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={axisStyle} {...ticks} />
            <YAxis tick={axisStyle} allowDecimals={false} />
            <Tooltip content={props => <DarkTooltip {...props} C={C} />} />
            <Bar dataKey="count" fill="#E8A020" radius={[3, 3, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Chart 3 */}
      <ChartCard
        title="Average Rating Over Time"
        subtitle="Weeks with data only"
        hasData={ratingHasData}
        loading={loading}
        C={C}
      >
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={ratingData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="date" tick={axisStyle} />
            <YAxis tick={axisStyle} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip content={props => <DarkTooltip {...props} C={C} />} />
            <Line type="monotone" dataKey="avg" stroke="#E8A020"
              strokeWidth={1.8} dot={{ r: 3, fill: '#E8A020' }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Starter plan: frosted glass overlay blocking analytics */}
      {isStarter && (
        <div className="ap-lock-overlay" style={{
          position: 'fixed',
          top: 0, bottom: 0, left: 240, right: 0,
          zIndex: 40,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(245,244,240,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            textAlign: 'center',
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '36px 44px',
            boxShadow: 'var(--ap-popup-shadow)', maxWidth: 400,
          }}>
            <p style={{ fontSize: 30, marginBottom: 14 }}>📊</p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.primary, marginBottom: 8 }}>
              Analytics is a Growth feature
            </h3>
            <p style={{ fontSize: 13, color: C.secondary, marginBottom: 24, lineHeight: 1.65 }}>
              Upgrade to Growth to unlock detailed charts, performance trends, and rating history across all time ranges.
            </p>
            <Link
              to="/pricing"
              style={{
                display: 'inline-block', padding: '12px 28px',
                backgroundColor: C.primary, color: 'var(--ap-bg)',
                borderRadius: 980, fontWeight: 700, fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Upgrade to Growth →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
