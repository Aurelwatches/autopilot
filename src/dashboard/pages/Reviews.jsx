import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useDashboard } from '../DashboardContext'
import { useApp } from '../AppContext'

const filters = ['All', 'Replied', 'Pending', '5 Star', '1–2 Star']

const MONTHLY_REVIEW_CAP = 100

const PULSE_CSS = `
@keyframes ap-approve-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.45); }
  60%       { box-shadow: 0 0 0 7px rgba(34,211,238,0); }
}
.ap-approve-btn { animation: ap-approve-pulse 2.2s ease-in-out infinite; }
`

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Stars({ rating }) {
  const r = Math.round(rating ?? 0)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i <= r ? '#F59E0B' : 'none'}
          stroke={i <= r ? '#F59E0B' : '#6B7280'}
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  )
}

function ratingBorderColor(rating) {
  if (!rating) return 'transparent'
  if (rating >= 5) return 'var(--ap-success)'
  if (rating >= 3) return '#F59E0B'
  return '#f87171'
}

function RobotIcon({ color }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <path d="M12 11V7"/>
      <circle cx="12" cy="5" r="2"/>
      <circle cx="8.5" cy="16" r="1" fill={color} stroke="none"/>
      <circle cx="12" cy="16" r="1" fill={color} stroke="none"/>
      <circle cx="15.5" cy="16" r="1" fill={color} stroke="none"/>
    </svg>
  )
}

function EmptyState({ C }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        className="mb-4" style={{ color: C.muted }}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      <p className="text-sm font-medium text-center" style={{ color: C.secondary }}>No reviews yet</p>
      <p className="text-xs text-center mt-1" style={{ color: C.muted, lineHeight: 1.6 }}>
        Once connected to Google Business, replies will appear here automatically.
      </p>
    </div>
  )
}

function rowToReview(row) {
  return {
    id:         row.id,
    name:       row.customer_name || row.reviewer_name || 'Unknown',
    rating:     row.rating || parseInt(row.star_rating) || null,
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
  const [reviews,        setReviews]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [active,         setActive]         = useState('All')
  const [approving,      setApproving]      = useState(new Set())
  const [editingId,      setEditingId]      = useState(null)
  const [editText,       setEditText]       = useState('')
  const [saving,         setSaving]         = useState(new Set())
  const [regenerating,   setRegenerating]   = useState(new Set())
  const [googleConnected, setGoogleConnected] = useState(null) // null = loading
  const [testingPipeline, setTestingPipeline] = useState(false)
  const [testResult,      setTestResult]      = useState('')

  const { events } = useDashboard()

  const isStarter = plan === 'starter'

  async function handleSaveEdit(reviewId) {
    if (!editText.trim()) return
    setSaving(prev => new Set(prev).add(reviewId))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`${API_URL}/api/reviews/set-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id: reviewId, ai_reply: editText.trim() }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Save failed'); return }
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: editText.trim() } : r))
      setEditingId(null)
    } catch (err) {
      alert(`Network error: ${err.message}`)
    } finally {
      setSaving(prev => { const s = new Set(prev); s.delete(reviewId); return s })
    }
  }

  async function handleRegenerate(reviewId) {
    setRegenerating(prev => new Set(prev).add(reviewId))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}/regenerate`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { alert('Server error — please wait a moment and try again.'); return }
      if (!res.ok) { alert(data.error || 'Regenerate failed'); return }
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: data.reply } : r))
      setEditingId(null)
    } catch (err) {
      alert(`Network error: ${err.message}`)
    } finally {
      setRegenerating(prev => { const s = new Set(prev); s.delete(reviewId); return s })
    }
  }

  async function fetchReviews() {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return }
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

  async function checkGoogleConnection() {
    if (!supabase || !userId) return
    const { data } = await supabase
      .from('profiles')
      .select('google_refresh_token')
      .eq('id', userId)
      .single()
    setGoogleConnected(!!data?.google_refresh_token)
  }

  async function handleTestPipeline() {
    setTestingPipeline(true)
    setTestResult('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`${API_URL}/api/test-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json()
      if (!res.ok) { setTestResult(`❌ ${data.error}`); return }
      setTestResult('✅ Test review sent! Check your email and the Pending filter.')
      fetchReviews()
    } catch (err) {
      setTestResult(`❌ ${err.message}`)
    } finally {
      setTestingPipeline(false)
    }
  }

  async function handleApprove(reviewId) {
    setApproving(prev => new Set(prev).add(reviewId))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}/approve`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Could not post to Google: ${data.error}`)
        return
      }
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'posted' } : r))
    } catch (err) {
      alert(`Network error: ${err.message}`)
    } finally {
      setApproving(prev => { const s = new Set(prev); s.delete(reviewId); return s })
    }
  }

  useEffect(() => {
    fetchReviews()
    checkGoogleConnection()
    const interval = setInterval(fetchReviews, 30000)
    return () => clearInterval(interval)
  }, [userId])

  const reviewEventCount = events.filter(e => e.type === 'review_replied').length
  useEffect(() => { if (reviewEventCount > 0) fetchReviews() }, [reviewEventCount])

  const repliedCount = reviews.filter(r => r.status === 'replied' || r.status === 'posted').length

  const now = new Date()
  const thisMonthCount = reviews.filter(r => {
    if (!r.created_at) return false
    const d = new Date(r.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length

  function matchesFilter(r, f) {
    if (f === 'Replied')  return r.status === 'replied' || r.status === 'posted'
    if (f === 'Pending')  return r.status === 'pending'
    if (f === '5 Star')   return r.rating === 5
    if (f === '1–2 Star') return r.rating >= 1 && r.rating <= 2
    return true
  }

  const countFor = f => reviews.filter(r => matchesFilter(r, f)).length
  const filtered = reviews.filter(r => matchesFilter(r, active))

  const ratedReviews = reviews.filter(r => Number(r.rating) > 0)
  const avgRating = ratedReviews.length
    ? (ratedReviews.reduce((s, r) => s + Number(r.rating), 0) / ratedReviews.length).toFixed(1)
    : null

  const capExceeded = thisMonthCount >= MONTHLY_REVIEW_CAP

  return (
    <div className="ap-page px-8 py-8" style={{ maxWidth: 900 }}>
      <style>{PULSE_CSS}</style>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', color: C.primary, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
            Reviews
          </h1>
          <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.6 }}>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} · synced automatically
          </p>
        </div>
        <div className="flex items-center gap-5">
          {repliedCount > 0 && (
            <span className="text-sm px-3 py-1 rounded-lg"
              style={{ backgroundColor: 'rgba(34,211,238,0.10)', color: 'var(--ap-success)', border: '1px solid rgba(34,211,238,0.2)' }}>
              {repliedCount} replied this month
            </span>
          )}
          {avgRating && (
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, color: C.primary, letterSpacing: '-0.025em', fontFamily: 'var(--font-display)' }}>{avgRating}</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <p style={{ fontSize: 11, marginTop: 2, color: C.muted }}>
                avg rating · {ratedReviews.length} rated
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Google not connected banner */}
      {googleConnected === false && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '14px 18px', borderRadius: 12, marginBottom: 20,
          backgroundColor: 'rgba(251,191,36,0.07)',
          border: '1px solid rgba(251,191,36,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🔗</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.primary }}>Connect Google Business Profile</p>
              <p style={{ margin: 0, fontSize: 12, color: C.secondary, marginTop: 2 }}>
                Link your account so AutoPilot can fetch and reply to real reviews automatically.
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/settings"
            style={{
              flexShrink: 0, fontSize: 12, fontWeight: 600, padding: '7px 16px',
              borderRadius: 8, textDecoration: 'none', color: '#000',
              backgroundColor: '#fbbf24', whiteSpace: 'nowrap',
            }}
          >
            Connect now →
          </Link>
        </div>
      )}

      {/* Test pipeline button */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={handleTestPipeline}
          disabled={testingPipeline}
          style={{
            fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8,
            border: `1px solid ${C.border}`, backgroundColor: C.card, color: C.secondary,
            cursor: testingPipeline ? 'not-allowed' : 'pointer', opacity: testingPipeline ? 0.6 : 1,
          }}
        >
          {testingPipeline ? 'Sending test…' : '🧪 Send Test Review (Groq)'}
        </button>
        {testResult && (
          <span style={{ marginLeft: 12, fontSize: 12, color: testResult.startsWith('✅') ? 'var(--ap-success)' : 'var(--ap-danger)' }}>
            {testResult}
          </span>
        )}
      </div>

      {/* Starter plan: monthly review cap indicator */}
      {isStarter && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderRadius: 12, marginBottom: 20,
          backgroundColor: capExceeded ? 'rgba(59,130,246,0.10)' : 'rgba(34,211,238,0.07)',
          border: `1px solid ${capExceeded ? 'rgba(59,130,246,0.26)' : 'rgba(34,211,238,0.18)'}`,
        }}>
          <span style={{ fontSize: 12, color: C.secondary, lineHeight: 1.6 }}>
            {capExceeded
              ? `⚠️ You've reached your 100-review limit for this month — upgrade to process more`
              : `You've used ${thisMonthCount} of ${MONTHLY_REVIEW_CAP} reviews this month`}
          </span>
          <Link
            to="/pricing"
            style={{ fontSize: 12, fontWeight: 600, color: C.accent, textDecoration: 'none', flexShrink: 0, marginLeft: 12, transition: 'opacity 150ms' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Upgrade →
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="ap-review-filters flex gap-1 mb-6">
        {filters.map(f => {
          const n = countFor(f)
          return (
            <button
              key={f}
              onClick={() => setActive(f)}
              className="text-xs px-3 py-1.5 rounded flex items-center gap-1.5"
              style={{
                backgroundColor: active === f ? C.primary : C.card,
                color:           active === f ? C.bg : C.secondary,
                border:          `1px solid ${active === f ? 'transparent' : C.border}`,
                fontWeight:      active === f ? 600 : 400,
                cursor: 'pointer',
                transition: 'background-color 150ms, color 150ms, border-color 150ms',
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
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)',
      }}>
        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-sm" style={{ color: C.muted }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? <EmptyState C={C} /> : (
          <div>
            {filtered.map((r, i) => {
              const isPending     = r.status === 'pending'
              const isPosted      = r.status === 'posted'
              const isApproving   = approving.has(r.id)
              const isEditing     = editingId === r.id
              const isSaving      = saving.has(r.id)
              const isRegenerating = regenerating.has(r.id)

              const badgeStyle = isPending
                ? { backgroundColor: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.15)' }
                : { backgroundColor: 'rgba(34,211,238,0.10)', color: 'var(--ap-success)', border: '1px solid rgba(34,211,238,0.2)' }

              const badgeText = isPending
                ? '⏳ Awaiting approval'
                : isPosted ? '✓ Posted to Google' : '✓ Replied'

              return (
                <div key={r.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.divider}` : 'none',
                    borderLeft: `3px solid ${ratingBorderColor(r.rating)}`,
                  }}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <span style={{ fontSize: 14, fontWeight: 600, color: C.primary, lineHeight: 1.4 }}>{r.name}</span>
                          <Stars rating={r.rating} />
                        </div>
                        <span style={{ fontSize: 11, color: C.muted }}>{r.date}</span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg shrink-0" style={badgeStyle}>
                        {badgeText}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: C.secondary }}>{r.text}</p>
                  </div>

                  <div className="px-5 pb-5 pt-0">
                    <div className="rounded-xl px-4 py-3"
                      style={{ backgroundColor: C.inputBg, border: `1px solid ${isEditing ? C.accent : C.divider}`, transition: 'border-color 150ms' }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <RobotIcon color={C.accent} />
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.muted, margin: 0 }}>
                          AutoPilot reply
                        </p>
                      </div>

                      {isEditing ? (
                        <>
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={4}
                            className="w-full text-sm outline-none resize-none"
                            style={{ backgroundColor: 'transparent', color: C.primary, border: 'none', lineHeight: 1.6, fontFamily: 'inherit' }}
                            autoFocus
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleSaveEdit(r.id)}
                              disabled={isSaving}
                              style={{
                                fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 8,
                                backgroundColor: isSaving ? 'rgba(34,211,238,0.06)' : 'rgba(34,211,238,0.12)',
                                color: isSaving ? C.muted : 'var(--ap-success)',
                                border: '1px solid rgba(34,211,238,0.25)',
                                cursor: isSaving ? 'default' : 'pointer',
                              }}
                            >{isSaving ? 'Saving…' : 'Save'}</button>
                            <button
                              onClick={() => handleRegenerate(r.id)}
                              disabled={isRegenerating}
                              style={{
                                fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 8,
                                backgroundColor: 'transparent',
                                color: isRegenerating ? C.muted : C.accent,
                                border: `1px solid ${C.border}`,
                                cursor: isRegenerating ? 'default' : 'pointer',
                              }}
                            >{isRegenerating ? 'Generating…' : 'Regenerate'}</button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{ fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 8, backgroundColor: 'transparent', color: C.secondary, border: `1px solid ${C.border}`, cursor: 'pointer' }}
                            >Cancel</button>
                          </div>
                        </>
                      ) : (
                        <p
                          onClick={() => r.reply && !isRegenerating && (setEditingId(r.id), setEditText(r.reply))}
                          style={{ fontSize: 14, lineHeight: 1.6, color: r.reply ? C.primary : C.muted, cursor: r.reply ? 'text' : 'default' }}
                        >
                          {isRegenerating ? <span style={{ color: C.muted }}>Generating new reply…</span> : (r.reply || 'No reply text received.')}
                        </p>
                      )}
                    </div>
                    {!isEditing && r.reply && (
                      <p style={{ fontSize: 11, color: C.muted, marginTop: 4, marginLeft: 2 }}>
                        Click the reply to edit · <button onClick={() => handleRegenerate(r.id)} disabled={isRegenerating} style={{ fontSize: 11, color: C.accent, background: 'none', border: 'none', cursor: isRegenerating ? 'default' : 'pointer', padding: 0 }}>{isRegenerating ? 'Generating…' : 'regenerate'}</button>
                      </p>
                    )}

                    {isPending && (
                      <button
                        onClick={() => handleApprove(r.id)}
                        disabled={isApproving}
                        className={isApproving ? '' : 'ap-approve-btn'}
                        style={{
                          marginTop: 10,
                          fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 10,
                          backgroundColor: isApproving ? 'rgba(34,211,238,0.06)' : 'rgba(34,211,238,0.12)',
                          color: isApproving ? C.muted : 'var(--ap-success)',
                          border: '1px solid rgba(34,211,238,0.25)',
                          cursor: isApproving ? 'default' : 'pointer',
                          transition: 'background-color 150ms, color 150ms',
                        }}
                        onMouseEnter={e => { if (!isApproving) e.currentTarget.style.backgroundColor = 'rgba(34,211,238,0.22)' }}
                        onMouseLeave={e => { if (!isApproving) e.currentTarget.style.backgroundColor = 'rgba(34,211,238,0.12)' }}
                      >
                        {isApproving ? 'Posting to Google…' : '✓ Approve & Post to Google'}
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
