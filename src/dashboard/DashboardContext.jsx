import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DashboardContext = createContext(null)

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function DashboardProvider({ children }) {
  const [events, setEvents] = useState([])

  useEffect(() => {
    let es = null
    let retryTimer = null
    const API = 'https://autopilot-production-7671.up.railway.app'

    async function connect() {
      // Get the current session token so the backend can auth the SSE stream
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return  // not logged in — don't connect

      const url = `${API}/api/events/stream?token=${encodeURIComponent(token)}`
      es = new EventSource(url)

      es.onmessage = e => {
        try { setEvents(JSON.parse(e.data)) } catch {}
      }

      es.onerror = () => {
        es.close()
        es = null
        // Fetch a snapshot so the UI isn't empty while waiting to reconnect
        fetch(`${API}/api/events`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).then(r => r.json()).then(setEvents).catch(() => {})
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

  const ratedReviews = reviews.filter(r => r.rating > 0)
  const avgRating = ratedReviews.length > 0
    ? (ratedReviews.reduce((s, r) => s + r.rating, 0) / ratedReviews.length).toFixed(1)
    : '0'

  const stats = {
    reviewsReplied: reviews.length,
    postsScheduled: posts.length,
    avgRating,
  }

  return (
    <DashboardContext.Provider value={{ events, reviews, posts, stats }}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => useContext(DashboardContext)
