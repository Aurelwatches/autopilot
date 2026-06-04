import { useDashboard } from '../DashboardContext'
import { useApp } from '../AppContext'

function EmptyState({ C }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        className="mb-4" style={{ color: C.muted }}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
      <p className="text-sm text-center" style={{ color: C.secondary }}>No follow-ups sent yet.</p>
      <p className="text-xs text-center mt-1" style={{ color: C.muted }}>Customer texts will appear here.</p>
    </div>
  )
}

export default function FollowUps() {
  const { followUps, stats } = useDashboard()
  const { C } = useApp()

  return (
    <div className="px-8 py-8" style={{ maxWidth: 1100 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: C.primary }}>Follow-ups</h1>
          <p className="text-sm" style={{ color: C.secondary }}>Customer re-engagement texts sent by AutoPilot</p>
        </div>
        <div className="flex gap-4 text-sm" style={{ color: C.secondary }}>
          <span><strong style={{ color: C.primary }}>{stats.textsSent}</strong> sent this month</span>
          <span><strong style={{ color: C.muted }}>—</strong> open rate</span>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        {followUps.length === 0 ? <EmptyState C={C} /> : (
          <>
            <div
              className="grid text-xs font-medium uppercase tracking-wider px-5 py-3"
              style={{
                gridTemplateColumns: '1.5fr 1fr 1fr 2.5fr 0.8fr',
                color: C.muted, borderBottom: `1px solid ${C.divider}`,
              }}
            >
              <span>Customer</span>
              <span>Phone</span>
              <span>Last visit</span>
              <span>Message sent</span>
              <span>Status</span>
            </div>
            {followUps.map((c, i) => (
              <div
                key={c.id}
                className="grid items-start px-5 py-3.5"
                style={{
                  gridTemplateColumns: '1.5fr 1fr 1fr 2.5fr 0.8fr',
                  borderBottom: i < followUps.length - 1 ? `1px solid ${C.divider}` : 'none',
                }}
              >
                <span className="text-sm font-medium" style={{ color: C.primary }}>{c.name}</span>
                <span className="text-sm" style={{ color: C.secondary }}>{c.phone}</span>
                <span className="text-sm" style={{ color: C.secondary }}>{c.visit}</span>
                <span className="text-sm pr-4 leading-relaxed" style={{ color: C.secondary }}>{c.message}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded self-start mt-0.5"
                  style={c.status === 'opened'
                    ? { backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }
                    : { backgroundColor: 'rgba(136,135,128,0.08)', color: C.secondary, border: '1px solid rgba(136,135,128,0.2)' }}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
