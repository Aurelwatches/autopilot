import { useDashboard } from '../DashboardContext'

const C = {
  card: '#141414', border: '#2A2A2A', divider: '#1E1E1E',
  primary: '#F0EEE9', secondary: '#888780', muted: '#3A3835', accent: '#4A90D9',
}

function EmptyChart({ label }) {
  return (
    <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
      <h2 className="text-sm font-semibold mb-0.5" style={{ color: C.primary }}>{label}</h2>
      <div className="flex flex-col items-center justify-center" style={{ height: 220 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="mb-4" style={{ color: C.muted }}>
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
          <line x1="2"  y1="20" x2="22" y2="20"/>
        </svg>
        <p className="text-sm text-center" style={{ color: C.secondary }}>Not enough data yet.</p>
        <p className="text-xs text-center mt-1" style={{ color: C.muted }}>Charts will populate as AutoPilot runs.</p>
      </div>
    </div>
  )
}

export default function Analytics() {
  const { stats } = useDashboard()

  const statCards = [
    { label: 'Reviews replied',   value: stats.reviewsReplied },
    { label: 'Posts published',   value: stats.postsScheduled },
    { label: 'Avg response time', value: '—'                  },
    { label: 'Avg rating',        value: stats.avgRating       },
  ]

  return (
    <div className="px-8 py-8" style={{ maxWidth: 1000 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: C.primary }}>Analytics</h1>
        <p className="text-sm" style={{ color: C.secondary }}>Performance over time</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="rounded-lg px-5 py-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-3" style={{ color: C.muted }}>{s.label}</p>
            <p className="text-3xl font-semibold tracking-tight mb-1" style={{ color: C.primary }}>{s.value}</p>
            <p className="text-xs" style={{ color: C.muted }}>—</p>
          </div>
        ))}
      </div>

      <EmptyChart label="Reviews Replied" />
      <EmptyChart label="Posts Published" />
    </div>
  )
}
