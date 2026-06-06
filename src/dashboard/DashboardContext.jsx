import { createContext, useContext, useState, useEffect } from 'react'

const DashboardContext = createContext(null)

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function DashboardProvider({ children }) {
  const [events, setEvents] = useState([])

  useEffect(() => {
    let es = null
    let retryTimer = null

    // Use the absolute Railway API URL so the SSE stream connects to the
    // Express server, not the Netlify frontend (a relative URL would hit
    // Netlify and get back an HTML 404, not text/event-stream).
    const API = 'https://autopilot-production-7671.up.railway.app'

    function connect() {
      es = new EventSource(`${API}/api/events/stream`)

      es.onmessage = e => {
        try { setEvents(JSON.parse(e.data)) } catch {}
      }

      es.onerror = () => {
        es.close()
        es = null
        // Fetch a snapshot so the UI isn't empty while waiting to reconnect
        fetch(`${API}/api/events`).then(r => r.json()).then(setEvents).catch(() => {})
        retryTimer = setTimeout(connect, 5000)
      }
    }

    connect()
    return () => {
      es?.close()
      clearTimeout(retryTimer)
    }
  }, [])

  // ── Derived page-level data ───────────────────────────────────────────────

  const seen = new Set()
  const reviews = events
    .filter(e => e.type === 'review_replied')
    .filter(e => {
      const key = `${e.customerName}||${e.reviewText || e.details || ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(e => {
      console.log('Mapping review event:', {
        customerName: e.customerName,
        reviewText:   e.reviewText,
        aiReply:      e.aiReply,
        details:      e.details,
      })
      return {
        id:     e.id,
        name:   e.customerName || 'Anonymous',
        rating: e.rating ?? 5,
        date:   formatDate(e.receivedAt),
        status: 'replied',
        text:   e.reviewText || e.details || '',
        reply:  e.aiReply    || '',
      }
    })

  const posts = events
    .filter(e => e.type === 'post_scheduled')
    .map(e => ({
      id:          e.id,
      platform:    e.platform || 'Instagram',
      text:        e.details  || '',
      scheduledAt: formatDate(e.receivedAt),
      status:      'scheduled',
    }))

  const followUps = events
    .filter(e => e.type === 'follow_up_sent')
    .map(e => ({
      id:      e.id,
      name:    e.customerName || '—',
      phone:   e.phone        || '—',
      visit:   e.lastVisit    || '—',
      message: e.details      || '',
      status:  'delivered',
    }))

  const ratedReviews = reviews.filter(r => r.rating > 0)
  const avgRating = ratedReviews.length > 0
    ? (ratedReviews.reduce((s, r) => s + r.rating, 0) / ratedReviews.length).toFixed(1)
    : '0'

  const stats = {
    reviewsReplied: reviews.length,
    postsScheduled: posts.length,
    textsSent:      followUps.length,
    avgRating,
  }

  return (
    <DashboardContext.Provider value={{ events, reviews, posts, followUps, stats }}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => useContext(DashboardContext)
