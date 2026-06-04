import { useDashboard } from '../DashboardContext'

const C = {
  card: '#141414', border: '#2A2A2A', divider: '#1E1E1E',
  primary: '#F0EEE9', secondary: '#888780', muted: '#3A3835', accent: '#4A90D9',
}

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

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="mb-4" style={{ color: C.muted }}>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <p className="text-sm text-center" style={{ color: C.secondary }}>No activity yet.</p>
      <p className="text-xs text-center mt-1" style={{ color: C.muted }}>AutoPilot will show live updates here.</p>
    </div>
  )
}

export default function Overview() {
  const { events, stats } = useDashboard()

  const feed = events.map((e, i) => {
    const mapped = TYPE_MAP[e.type] ?? { type: 'review', text: e.type }
    return {
      type:   mapped.type,
      text:   mapped.text,
      detail: [e.customerName, e.details].filter(Boolean).join(' · ') || '—',
      time:   relativeTime(e.receivedAt),
      newest: i === 0,
    }
  })

  const statCards = [
    { label: 'Reviews Replied', value: stats.reviewsReplied },
    { label: 'Posts Scheduled', value: stats.postsScheduled },
    { label: 'Texts Sent',      value: stats.textsSent      },
    { label: 'Avg Rating',      value: stats.avgRating      },
  ]

  return (
    <div className="px-8 py-8" style={{ maxWidth: 1100 }}>

      {/* Status bar */}
      <div className="flex items-center gap-3 rounded px-4 py-3 mb-8 text-sm" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <span className="w-2 h-2 rounded-full shrink-0 pulse-dot" style={{ backgroundColor: '#4ade80', display: 'inline-block' }} />
        <span style={{ color: C.primary }}>AutoPilot is running</span>
        <span style={{ color: C.muted }}>·</span>
        <span style={{ color: C.secondary }}>
          {events.length > 0 ? `${events.length} event${events.length !== 1 ? 's' : ''} received` : 'Waiting for first event'}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: C.primary }}>{greeting}, Mario's Trattoria</h1>
        <p className="text-sm" style={{ color: C.secondary }}>{today}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="rounded-lg px-5 py-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-3" style={{ color: C.muted }}>{s.label}</p>
            <p className="text-3xl font-semibold tracking-tight mb-1" style={{ color: C.primary }}>{s.value}</p>
            <p className="text-xs" style={{ color: C.muted }}>—</p>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.divider}` }}>
          <h2 className="text-sm font-semibold" style={{ color: C.primary }}>Recent Activity</h2>
          {events.length > 0 && (
            <span className="text-[11px] flex items-center gap-1.5" style={{ color: C.secondary }}>
              <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: '#4ade80', display: 'inline-block' }} />
              Live
            </span>
          )}
        </div>

        {feed.length === 0 ? <EmptyFeed /> : (
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
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 pulse-dot" style={{ backgroundColor: '#4ade80', display: 'inline-block' }} />
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
