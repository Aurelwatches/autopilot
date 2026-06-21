import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useDashboard } from '../DashboardContext'
import { useApp } from '../AppContext'

const filters = ['All', 'Replied', 'Pending', '5 Star', '1–2 Star']

const MONTHLY_REVIEW_CAP = 100

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Stars({ rating }) {
  const r = Math.round(rating ?? 0)
  return (
    <span style={{ letterSpacing: '-1px', fontSize: 13, color: 'var(--ap-accent)' }}>
      {'★'.repeat(r)}
      <span style={{ opacity: 0.3 }}>{'★'.repeat(Math.max(0, 5 - r))}</span>
    </span>
  )
}

function EmptyState({ C }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        className="mb-4" style={{ color: C.muted }}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      <p className="text-sm text-center" style={{ color: C.secondary }}>No reviews yet.</p>
      <p className="text-xs text-center mt-1" style={{ color: C.muted }}>
        Once connected to Google Business, replies will appear here.
      </p>
    </div>
  )
}

// Reviews table mixes two schemas:
//   old: reviewer_name, review, response, star_rating (text)
//   new: customer_name, review_text, ai_reply, rating, status, user_id
// Read from whichever columns are present.
function rowToReview(row) {
  return {
    id:         row.id,
    name:       row.customer_name || row.reviewer_name || 'Unknown',
    rating:     row.rating || parseInt(row.star_rating) || null,  // null excluded from the average
    date:       formatDate(row.created_at),
    created_at: row.created_at,
    status:     row.status || 'replied',
    text:       row.review_text || row.review || '',
    reply:      row.ai_reply || row.response || '',
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'https://autopilot-production-7671.up.railway.app'

export default function Reviews() {
  const { C, userId, plan } = useApp()
  const [reviews,   setReviews]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [active,    setActive]    = useState('All')
  const [approving, setApproving] = useState(new Set()) // Supabase row ids currently being posted

  const { events } = useDashboard()

  const isStarter = plan === 'starter'

  async function fetchReviews() {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return }
    // Wait for auth so the query is always filtered to the logged-in user
    if (!userId) { setLoading(false); return }
    try {
      const { data, error: err } = await supabase
        .from('reviews').select('*')
        .eq('user_id', userId).order('created_at', { ascending: false })
      if (err) throw err
      setReviews((data ?? []).map(rowToReview))
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load reviews.')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(reviewId) {
    setApproving(prev => new Set(prev).add(reviewId))
    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}/approve`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(`Could not post to Google: ${data.error}`)
        return
      }
      // Optimistically update local state — no re-fetch needed
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'posted' } : r))
    } catch (err) {
      alert(`Network error: ${err.message}`)
    } finally {
      setApproving(prev => { const s = new Set(prev); s.delete(reviewId); return s })
    }
  }

  // Re-fetch when auth resolves (userId goes null → real id) and poll every 30s
  // so newly saved reviews appear without a manual refresh.
  useEffect(() => {
    fetchReviews()
    const interval = setInterval(fetchReviews, 30000)
    return () => clearInterval(interval)
  }, [userId])

  // Instant refresh when a review_replied event streams in over SSE
  const reviewEventCount = events.filter(e => e.type === 'review_replied').length
  useEffect(() => { if (reviewEventCount > 0) fetchReviews() }, [reviewEventCount])

  const repliedCount = reviews.filter(r => r.status === 'replied' || r.status === 'posted').length

  // This month's review count — used for Starter plan cap display
  const now = new Date()
  const thisMonthCount = reviews.filter(r => {
    if (!r.created_at) return false
    const d = new Date(r.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length

  // Count matching reviews for a given filter — drives the per-tab badges
  // (the star-rating breakdown) and reuses the same predicate as filtering.
  function matchesFilter(r, f) {
    if (f === 'Replied')  return r.status === 'replied' || r.status === 'posted'
    if (f === 'Pending')  return r.status === 'pending'
    if (f === '5 Star')   return r.rating === 5
    if (f === '1–2 Star') return r.rating >= 1 && r.rating <= 2
    return true
  }

  const countFor = f => reviews.filter(r => matchesFilter(r, f)).length
  const filtered = reviews.filter(r => matchesFilter(r, active))

  // Average rating across reviews that actually have a rating — null/0 excluded
  const ratedReviews = reviews.filter(r => Number(r.rating) > 0)
  const avgRating = ratedReviews.length
    ? (ratedReviews.reduce((s, r) => s + Number(r.rating), 0) / ratedReviews.length).toFixed(1)
    : null

  const capExceeded = thisMonthCount >= MONTHLY_REVIEW_CAP

  return (
    <div className="ap-page px-8 py-8" style={{ maxWidth: 900 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: C.primary, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Reviews</h1>
          <p className="text-sm" style={{ color: C.secondary }}>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} · synced automatically
          </p>
        </div>
        <div className="flex items-center gap-5">
          {repliedCount > 0 && (
            <span className="text-sm px-3 py-1 rounded"
              style={{ backgroundColor: 'rgba(34,211,238,0.10)', color: 'var(--ap-success)', border: '1px solid rgba(34,211,238,0.2)' }}>
              {repliedCount} replied this month
            </span>
          )}
          {avgRating && (
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span style={{ fontSize: 38, fontWeight: 700, lineHeight: 1, color: C.primary }}>{avgRating}</span>
                <span style={{ fontSize: 22, color: 'var(--ap-accent)', lineHeight: 1 }}>★</span>
              </div>
              <p className="text-xs mt-1" style={{ color: C.muted }}>
                avg rating · {ratedReviews.length} rated
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Starter plan: monthly review cap indicator */}
      {isStarter && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderRadius: 10, marginBottom: 20,
          backgroundColor: capExceeded ? 'rgba(59,130,246,0.10)' : 'rgba(34,211,238,0.07)',
          border: `1px solid ${capExceeded ? 'rgba(59,130,246,0.26)' : 'rgba(34,211,238,0.18)'}`,
        }}>
          <span style={{ fontSize: 12, color: C.secondary }}>
            {capExceeded
              ? `⚠️ You've reached your 100-review limit for this month — upgrade to process more`
              : `You've used ${thisMonthCount} of ${MONTHLY_REVIEW_CAP} reviews this month`}
          </span>
          <Link
            to="/pricing"
            style={{ fontSize: 12, fontWeight: 600, color: C.accent, textDecoration: 'none', flexShrink: 0, marginLeft: 12 }}
          >
            Upgrade →
          </Link>
        </div>
      )}

      {/* Filters — label + live count (star-rating breakdown) */}
      <div className="ap-review-filters flex gap-1 mb-6">
        {filters.map(f => {
          const n = countFor(f)
          return (
            <button
              key={f}
              onClick={() => setActive(f)}
              className="text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
              style={{
                backgroundColor: active === f ? C.primary : C.card,
                color:           active === f ? C.bg : C.secondary,
                border:          `1px solid ${active === f ? 'transparent' : C.border}`,
                fontWeight:      active === f ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {f}
              <span style={{
                fontSize: 10, fontWeight: 600, borderRadius: 999, padding: '0 6px',
                backgroundColor: active === f ? 'rgba(0,0,0,0.18)' : C.inputBg,
                color: active === f ? C.bg : C.muted,
              }}>{n}</span>
            </button>
          )
        })}
      </div>

      {error && (
        <div style={{
          padding: '11px 16px', borderRadius: 8, marginBottom: 14,
          backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--ap-danger)', margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: 'hidden',
        backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
        boxShadow: C.cardShadow,
      }}>
        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-sm" style={{ color: C.muted }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? <EmptyState C={C} /> : (
          <div>
            {filtered.map((r, i) => {
              const isPending   = r.status === 'pending'
              const isPosted    = r.status === 'posted'
              const isApproving = approving.has(r.id)

              const badgeStyle = (isPending)
                ? { backgroundColor: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.15)' }
                : { backgroundColor: 'rgba(34,211,238,0.10)', color: 'var(--ap-success)', border: '1px solid rgba(34,211,238,0.2)' }

              const badgeText = isPending
                ? '⏳ Awaiting approval'
                : isPosted ? '✓ Posted to Google' : '✓ Replied'

              return (
                <div key={r.id}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold" style={{ color: C.primary }}>{r.name}</span>
                          <Stars rating={r.rating} />
                        </div>
                        <span className="text-xs" style={{ color: C.muted }}>{r.date}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded shrink-0" style={badgeStyle}>
                        {badgeText}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: C.secondary }}>{r.text}</p>
                  </div>
                  <div className="px-5 pb-5 pt-0">
                    <div className="rounded px-4 py-3"
                      style={{ backgroundColor: C.inputBg, border: `1px solid ${C.divider}` }}>
                      <p className="text-[11px] font-medium mb-1.5" style={{ color: C.muted }}>AutoPilot reply</p>
                      <p className="text-sm leading-relaxed" style={{ color: r.reply ? C.primary : C.muted }}>
                        {r.reply || 'No reply text received.'}
                      </p>
                    </div>
                    {isPending && (
                      <button
                        onClick={() => handleApprove(r.id)}
                        disabled={isApproving}
                        className="mt-3 text-xs font-semibold px-4 py-2 rounded transition-colors"
                        style={{
                          backgroundColor: isApproving ? 'rgba(34,211,238,0.08)' : 'rgba(34,211,238,0.14)',
                          color: isApproving ? C.muted : 'var(--ap-success)',
                          border: '1px solid rgba(34,211,238,0.25)',
                          cursor: isApproving ? 'default' : 'pointer',
                        }}
                        onMouseEnter={e => { if (!isApproving) e.currentTarget.style.backgroundColor = 'rgba(34,211,238,0.22)' }}
                        onMouseLeave={e => { if (!isApproving) e.currentTarget.style.backgroundColor = 'rgba(34,211,238,0.14)' }}
                      >
                        {isApproving ? 'Posting to Google…' : 'Approve & Post to Google'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
