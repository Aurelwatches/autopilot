import { useState } from 'react'
import { useDashboard } from '../DashboardContext'

const C = {
  card: '#141414', border: '#2A2A2A', divider: '#1E1E1E',
  primary: '#F0EEE9', secondary: '#888780', muted: '#3A3835', accent: '#4A90D9',
}

const filters = ['All', 'Replied', 'Pending', '5 Star', '1–2 Star']

function Stars({ rating }) {
  return (
    <span style={{ color: C.primary, letterSpacing: '-1px', fontSize: 13 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="mb-4" style={{ color: C.muted }}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      <p className="text-sm text-center" style={{ color: C.secondary }}>No reviews yet.</p>
      <p className="text-xs text-center mt-1" style={{ color: C.muted }}>Once connected to Google Business, replies will appear here.</p>
    </div>
  )
}

export default function Reviews() {
  const { reviews, stats } = useDashboard()
  const [active, setActive] = useState('All')

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
        {stats.reviewsReplied > 0 && (
          <span className="text-sm px-3 py-1 rounded" style={{ backgroundColor: '#1a2a1a', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>
            {stats.reviewsReplied} replied this month
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
              backgroundColor: active === f ? '#F0EEE9' : C.card,
              color:           active === f ? '#0A0A0A' : C.secondary,
              border:          `1px solid ${active === f ? 'transparent' : C.border}`,
              fontWeight:      active === f ? 600 : 400,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        {filtered.length === 0 ? <EmptyState /> : (
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {filtered.map((r, i) => (
              <div key={r.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: C.primary }}>{r.name}</span>
                        <Stars rating={r.rating} />
                      </div>
                      <span className="text-xs" style={{ color: C.muted }}>{r.date}</span>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded shrink-0"
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
                  <div className="rounded px-4 py-3" style={{ backgroundColor: '#0F0F0F', border: `1px solid ${C.divider}` }}>
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
