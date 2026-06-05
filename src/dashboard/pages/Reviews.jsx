import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useDashboard } from '../DashboardContext'
import { useApp } from '../AppContext'

const filters = ['All', 'Replied', 'Pending', '5 Star', '1–2 Star']

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Stars({ rating }) {
  const r = Math.round(rating ?? 0)
  return (
    <span style={{ letterSpacing: '-1px', fontSize: 13, color: '#E8A020' }}>
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

function rowToReview(row) {
  return {
    id:     row.id,
    name:   row.customer_name || 'Anonymous',
    rating: row.rating ?? 5,
    date:   formatDate(row.created_at),
    status: row.status ?? 'pending',
    text:   row.review_text ?? '',
    reply:  row.ai_reply    ?? '',
  }
}

export default function Reviews() {
  const { C, userId } = useApp()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [active,  setActive]  = useState('All')

  const { events } = useDashboard()

  async function fetchReviews() {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return }
    try {
      let q = supabase.from('reviews').select('*').order('created_at', { ascending: false })
      if (userId) q = q.eq('user_id', userId)
      const { data, error: err } = await q
      if (err) throw err
      setReviews((data ?? []).map(rowToReview))
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load reviews.')
    } finally {
      setLoading(false)
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

  const repliedCount = reviews.filter(r => r.status === 'replied').length

  const filtered = reviews.filter(r => {
    if (active === 'Replied')  return r.status === 'replied'
    if (active === 'Pending')  return r.status === 'pending'
    if (active === '5 Star')   return r.rating === 5
    if (active === '1–2 Star') return r.rating <= 2
    return true
  })

  return (
    <div className="px-8 py-8" style={{ maxWidth: 900 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: C.primary }}>Reviews</h1>
          <p className="text-sm" style={{ color: C.secondary }}>Google Reviews — synced automatically</p>
        </div>
        {repliedCount > 0 && (
          <span className="text-sm px-3 py-1 rounded"
            style={{ backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>
            {repliedCount} replied this month
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-6">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className="text-xs px-3 py-1.5 rounded transition-colors"
            style={{
              backgroundColor: active === f ? C.primary : C.card,
              color:           active === f ? C.bg : C.secondary,
              border:          `1px solid ${active === f ? 'transparent' : C.border}`,
              fontWeight:      active === f ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '11px 16px', borderRadius: 8, marginBottom: 14,
          backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="rounded-lg overflow-hidden"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-sm" style={{ color: C.muted }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? <EmptyState C={C} /> : (
          <div>
            {filtered.map((r, i) => (
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
                    <span className="text-xs px-2 py-0.5 rounded shrink-0"
                      style={r.status === 'replied'
                        ? { backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }
                        : { backgroundColor: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.15)' }}
                    >
                      {r.status === 'replied' ? '✓ Replied' : '⏳ Pending'}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
