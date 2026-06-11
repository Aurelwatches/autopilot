import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useApp } from '../AppContext'

// Default the schedule picker to tomorrow at 10:00 AM.
function defaultScheduleDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return d
}

const STATUS_LABEL = { draft: 'Draft', scheduled: 'Scheduled', published: 'Published' }
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

// M/DD/YYYY (month no leading zero, day padded) per spec.
function fmtMDY(d) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}/${String(dt.getDate()).padStart(2, '0')}/${dt.getFullYear()}`
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatSchedule(row) {
  if (row.status === 'scheduled' && row.scheduled_at) return `Scheduled · ${fmtMDY(row.scheduled_at)} · ${fmtTime(row.scheduled_at)}`
  if (row.status === 'published') return `Published · ${fmtMDY(row.scheduled_at || row.created_at)}`
  if (row.status === 'draft')     return 'Draft'
  return row.created_at ? fmtMDY(row.created_at) : '—'
}

// Dark inline calendar + time dropdowns. `value` is a Date; `onChange(nextDate)`.
function DateTimePicker({ value, onChange, C }) {
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1))
  const year = view.getFullYear()
  const month = view.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isSelected = d => d != null &&
    value.getFullYear() === year && value.getMonth() === month && value.getDate() === d

  function pickDay(d) {
    const next = new Date(value)
    next.setFullYear(year, month, d)
    onChange(next)
  }

  const h24 = value.getHours()
  const h12 = ((h24 + 11) % 12) + 1
  const ampm = h24 < 12 ? 'AM' : 'PM'
  const minute = value.getMinutes()

  function setTimeParts({ h = h12, m = minute, ap = ampm }) {
    let hh = h % 12
    if (ap === 'PM') hh += 12
    const next = new Date(value)
    next.setHours(hh, m, 0, 0)
    onChange(next)
  }

  const navBtn = {
    background: 'transparent', border: `1px solid ${C.border}`, color: C.secondary,
    borderRadius: 6, width: 26, height: 26, cursor: 'pointer', fontSize: 14, lineHeight: 1,
  }
  const ddStyle = {
    backgroundColor: C.inputBg, color: C.primary, border: `1px solid ${C.border}`,
    borderRadius: 6, padding: '6px 8px', fontSize: 13, outline: 'none', cursor: 'pointer',
  }

  return (
    <div style={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button type="button" onClick={() => setView(new Date(year, month - 1, 1))} style={navBtn} aria-label="Previous month">‹</button>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{MONTHS[month]} {year}</span>
        <button type="button" onClick={() => setView(new Date(year, month + 1, 1))} style={navBtn} aria-label="Next month">›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: 'center', fontSize: 10, color: C.muted, padding: '2px 0' }}>{w}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((d, i) => d === null ? <div key={i} /> : (
          <button
            key={i}
            type="button"
            onClick={() => pickDay(d)}
            style={{
              aspectRatio: '1 / 1', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              backgroundColor: isSelected(d) ? C.accent : 'transparent',
              color: isSelected(d) ? '#fff' : C.primary,
              fontWeight: isSelected(d) ? 600 : 400,
            }}
            onMouseEnter={e => { if (!isSelected(d)) e.currentTarget.style.backgroundColor = C.inputBg }}
            onMouseLeave={e => { if (!isSelected(d)) e.currentTarget.style.backgroundColor = 'transparent' }}
          >{d}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.divider}` }}>
        <span style={{ fontSize: 11, color: C.secondary, marginRight: 2 }}>Time</span>
        <select value={h12} onChange={e => setTimeParts({ h: Number(e.target.value) })} style={ddStyle} aria-label="Hour">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span style={{ color: C.muted }}>:</span>
        <select value={minute} onChange={e => setTimeParts({ m: Number(e.target.value) })} style={ddStyle} aria-label="Minute">
          {Array.from({ length: 12 }, (_, i) => i * 5).map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
        </select>
        <select value={ampm} onChange={e => setTimeParts({ ap: e.target.value })} style={ddStyle} aria-label="AM/PM">
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  )
}

const LOADING_MSGS = [
  'AutoPilot is drafting your post…',
  'Choosing the perfect words…',
  'Almost ready for takeoff…',
  'Polishing your caption…',
]
const TRAIL_DOTS = [12, 24, 36, 50, 63, 76, 88]

const statusStyle = {
  scheduled: { bg: 'rgba(251,122,30,0.10)', color: 'var(--ap-accent)', border: 'rgba(251,122,30,0.22)' },
  published:  { bg: 'rgba(22,199,132,0.10)', color: 'var(--ap-success)', border: 'rgba(22,199,132,0.22)' },
  draft:      { bg: 'rgba(136,135,128,0.08)', color: '#888780', border: 'rgba(136,135,128,0.2)' },
}

// Growth upsell banner: dismissed timestamp in localStorage, reappears after 7 days
const GROWTH_BANNER_KEY = 'ap_growth_banner_dismissed_at'
function shouldShowGrowthBanner() {
  const ts = localStorage.getItem(GROWTH_BANNER_KEY)
  if (!ts) return true
  return Date.now() - parseInt(ts, 10) > 7 * 24 * 60 * 60 * 1000
}

function EmptyState({ C }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        className="mb-4" style={{ color: C.muted }}>
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      <p className="text-sm text-center" style={{ color: C.secondary }}>No posts yet.</p>
      <p className="text-xs text-center mt-1" style={{ color: C.muted }}>
        AutoPilot will schedule and publish posts automatically.
      </p>
    </div>
  )
}

function PostCard({ p, onDelete, C }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const s = statusStyle[p.status] ?? statusStyle.draft

  function handleTransitionEnd(e) {
    if (deleting && e.propertyName === 'opacity') onDelete(p.id)
  }

  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16,
        backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
        boxShadow: C.cardShadow,
        opacity: deleting ? 0 : 1,
        transform: deleting ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="p-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${C.divider}` }}>
        <span className="text-xs font-semibold" style={{ color: C.primary }}>{p.platform}</span>

        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: C.secondary }}>Delete?</span>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs px-2 py-0.5 rounded"
              style={{ color: C.secondary, border: `1px solid ${C.border}`, cursor: 'pointer' }}
            >Cancel</button>
            <button
              onClick={() => setDeleting(true)}
              className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}
            >Delete</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
            <button
              onClick={() => setConfirming(true)}
              style={{ color: C.muted, lineHeight: 1, padding: 2, transition: 'color 0.15s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}
              title="Delete post"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="p-4 flex-1">
        <p className="text-sm leading-relaxed" style={{ color: C.secondary }}>{p.text}</p>
      </div>
      <div className="px-4 pb-4">
        <p className="text-xs" style={{ color: C.muted }}>{p.scheduledAt}</p>
      </div>
    </div>
  )
}

export default function SocialPosts() {
  const { C, theme, userId, plan } = useApp()

  const isStarter = plan === 'starter'
  const isGrowth  = plan === 'growth'

  const [posts,      setPosts]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [showForm,   setShowForm]   = useState(false)
  const [platform,   setPlatform]   = useState('Instagram')
  const [topic,      setTopic]      = useState('')
  const [text,       setText]       = useState('')
  const [scheduleDate, setScheduleDate] = useState(defaultScheduleDate)
  const [isLoading,  setIsLoading]  = useState(false)
  const [msgIdx,     setMsgIdx]     = useState(0)
  const [aiError,    setAiError]    = useState('')
  const [postTone,   setPostTone]   = useState('friendly')

  // Growth upsell banner — dismissible, returns every 7 days
  const [showBanner, setShowBanner] = useState(() => isGrowth && shouldShowGrowthBanner())
  function dismissBanner() {
    localStorage.setItem(GROWTH_BANNER_KEY, String(Date.now()))
    setShowBanner(false)
  }

  // Fetch the user's post_tone preference so AI Assist matches their style
  useEffect(() => {
    if (!supabase || !userId) return
    supabase.from('profiles').select('post_tone').eq('id', userId).single()
      .then(({ data }) => { if (data?.post_tone) setPostTone(data.post_tone) })
  }, [userId])

  // Load the user's saved posts; re-fetch once auth resolves and poll every 30s
  async function fetchPosts() {
    if (!supabase || !userId) { setLoading(false); return }
    const { data, error } = await supabase
      .from('posts').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false })
    if (!error) setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
    const id = setInterval(fetchPosts, 30000)
    return () => clearInterval(id)
  }, [userId])

  useEffect(() => {
    if (!isLoading) return
    const id = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MSGS.length), 1500)
    return () => clearInterval(id)
  }, [isLoading])

  async function handleAI() {
    if (!topic.trim() || isLoading) return
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey) {
      setAiError('VITE_GROQ_API_KEY is not set in .env — add your key and restart the dev server.')
      return
    }
    setIsLoading(true); setAiError(''); setMsgIdx(0)
    const charHint = platform === 'Twitter' ? 'Keep it under 280 characters.' : 'Aim for 150–300 characters.'

    const TONE_DESC = {
      friendly:     'Friendly & casual, warm and conversational',
      professional: 'Professional and polished, business-appropriate',
      energetic:    'Energetic and fun, lots of enthusiasm and personality',
    }
    const toneDesc = TONE_DESC[postTone] ?? TONE_DESC.friendly

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 512,
          messages: [
            { role: 'system', content: `You are a social media expert for independent restaurants. Write engaging, authentic posts that sound like a real restaurant owner wrote them — not a marketing agency. Be specific and include relevant emojis and 3-5 hashtags. Tone: ${toneDesc}.` },
            { role: 'user', content: `Write a ${platform} post about: ${topic.trim()}. ${charHint} Return only the post text, nothing else.` },
          ],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || `Groq API error ${res.status}`)
      setText(data.choices[0].message.content.trim())
    } catch (err) {
      setAiError(err.message || 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave(status) {
    if (!text.trim() || saving) return
    if (!supabase || !userId) { setAiError('Sign in to save posts.'); return }

    // Resolve scheduled_at by status: scheduled → picked time; published → now; draft → null
    let scheduled_at = null
    if (status === 'scheduled') {
      scheduled_at = scheduleDate.toISOString()
    } else if (status === 'published') {
      scheduled_at = new Date().toISOString()
    }

    // Sanitize before saving: strip HTML tags, trim, cap length
    const content = text.replace(/<\/?[^>]*>/g, '').trim().slice(0, 5000)

    setSaving(true)
    const { data, error } = await supabase.from('posts').insert({
      user_id:  userId,
      platform,
      content,   // DB column is 'content', not 'text'
      status,
      scheduled_at,
    }).select().single()

    // Log a post_scheduled activity so the Overview "Posts Scheduled" stat counts it.
    // Store post_id so we can remove this row again if the post is deleted.
    if (!error && status === 'scheduled' && data) {
      const { error: actErr } = await supabase.from('activity_feed').insert({
        type:        'post_scheduled',
        description: content.slice(0, 50),
        user_id:     userId,
        post_id:     data.id,
        created_at:  new Date().toISOString(),
      })
      if (actErr) console.error('[SocialPosts] activity_feed insert:', actErr.message)
    }

    setSaving(false)
    if (error) { setAiError(error.message); return }
    setPosts(prev => [data, ...prev])
    handleCloseForm()
  }

  function handleCloseForm() {
    setShowForm(false); setIsLoading(false); setAiError('')
    setText(''); setTopic(''); setPlatform('Instagram'); setScheduleDate(defaultScheduleDate())
  }

  // Called by PostCard after its exit animation finishes
  async function handleDelete(id) {
    setPosts(prev => prev.filter(p => p.id !== id))
    if (supabase) {
      // Remove the linked post_scheduled activity row first, then the post.
      // (The FK's ON DELETE CASCADE is a backstop if this is ever skipped.)
      await supabase.from('activity_feed').delete().eq('post_id', id)
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) fetchPosts() // re-sync if the delete didn't persist
    }
  }

  const allPosts = posts.map(p => ({
    id:          p.id,
    platform:    p.platform,
    text:        p.content,   // DB column is 'content'
    status:      p.status,
    scheduledAt: formatSchedule(p),
  }))

  return (
    <div className="ap-page px-8 py-8" style={{ maxWidth: 1100 }}>

      {/* Growth upsell banner — shown to Growth plan users, dismissible for 7 days */}
      {isGrowth && showBanner && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '10px 16px', borderRadius: 10, marginBottom: 20,
          backgroundColor: 'rgba(245,180,60,0.10)',
          border: '1px solid rgba(245,180,60,0.24)',
        }}>
          <span style={{ fontSize: 12, color: '#D97706' }}>
            ⚡ AutoPilot Pro unlocks AI phone answering and custom brand voice
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Link
              to="/pricing"
              style={{ fontSize: 12, fontWeight: 700, color: '#D97706', textDecoration: 'none' }}
            >
              Upgrade →
            </Link>
            <button
              onClick={dismissBanner}
              style={{ fontSize: 16, lineHeight: 1, color: C.muted, cursor: 'pointer', padding: '0 2px' }}
              title="Dismiss"
            >×</button>
          </div>
        </div>
      )}

      <div className="ap-posts-header flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: C.primary, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Social Posts</h1>
          <p className="text-sm" style={{ color: C.secondary }}>Scheduled and published content</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="ap-posts-newbtn text-sm font-bold px-4 py-2 rounded transition-colors"
          style={{ backgroundColor: C.accent, color: 'var(--ap-on-accent)', cursor: 'pointer', boxShadow: '0 4px 16px rgba(251,122,30,0.28)' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + New post
        </button>
      </div>

      {loading && allPosts.length === 0 ? (
        <div style={{
          backgroundColor: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: 'hidden',
          backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
          boxShadow: C.cardShadow,
          display: 'flex', justifyContent: 'center', padding: '80px 0',
        }}>
          <p className="text-sm" style={{ color: C.muted }}>Loading…</p>
        </div>
      ) : allPosts.length === 0 ? (
        <div style={{
          backgroundColor: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: 'hidden',
          backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
          boxShadow: C.cardShadow,
        }}>
          <EmptyState C={C} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allPosts.map(p => <PostCard key={p.id} p={p} onDelete={handleDelete} C={C} />)}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={e => e.target === e.currentTarget && handleCloseForm()}
        >
          <div className="w-full p-8" style={{
            maxWidth: 520, backgroundColor: C.card, border: `1px solid ${C.border}`,
            borderRadius: 20,
            backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
            boxShadow: C.cardShadow,
          }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold" style={{ color: C.primary }}>New post</h2>
              <button onClick={handleCloseForm} style={{ color: C.muted, fontSize: 18, lineHeight: 1, cursor: 'pointer' }}>×</button>
            </div>

            {/* Platform */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>Platform</label>
              <div className="ap-platform-tabs flex gap-2">
                {['Instagram', 'Facebook', 'Twitter'].map(pl => (
                  <button
                    key={pl}
                    onClick={() => setPlatform(pl)}
                    className="text-sm px-4 py-1.5 rounded transition-colors"
                    style={{
                      backgroundColor: platform === pl ? C.primary : C.inputBg,
                      color: platform === pl ? C.bg : C.secondary,
                      border: `1px solid ${platform === pl ? 'transparent' : C.border}`,
                      fontWeight: platform === pl ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >{pl}</button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>
                What's the post about?
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAI()}
                placeholder="e.g. Taco Tuesday special, new pasta dish, happy hour deals…"
                className="w-full text-sm px-4 py-2.5 rounded outline-none"
                style={{ backgroundColor: C.inputBg, color: C.primary, border: `1px solid ${C.border}` }}
                onFocus={e => e.target.style.borderColor = C.secondary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>

            {/* Post copy */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: C.secondary }}>Post copy</label>
                <button
                  onClick={handleAI}
                  disabled={!topic.trim() || isLoading}
                  className="text-xs px-2.5 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--ap-accent-soft)', color: 'var(--ap-accent)',
                    border: '1px solid rgba(251,122,30,0.28)',
                    opacity: !topic.trim() || isLoading ? 0.4 : 1,
                    cursor: !topic.trim() || isLoading ? 'default' : 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                >✦ AI assist</button>
              </div>

              {aiError && <p style={{ fontSize: 11, color: '#f87171', marginBottom: 6 }}>{aiError}</p>}

              <div style={{ position: 'relative' }}>
                <textarea
                  rows={4}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Write your post, or describe it above and click AI assist…"
                  className="w-full text-sm px-4 py-3 rounded outline-none resize-none"
                  readOnly={isLoading}
                  style={{
                    backgroundColor: C.inputBg, color: C.primary, border: `1px solid ${C.border}`,
                    pointerEvents: isLoading ? 'none' : 'auto',
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.35s ease',
                  }}
                  onFocus={e => e.target.style.borderColor = C.secondary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />

                {/* Loading overlay */}
                <div aria-hidden={!isLoading} style={{
                  position: 'absolute', inset: 0, borderRadius: 6,
                  backgroundColor: C.inputBg, border: `1px solid ${C.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 10,
                  pointerEvents: isLoading ? 'auto' : 'none',
                  opacity: isLoading ? 1 : 0,
                  transition: 'opacity 0.35s ease',
                }}>
                  <div style={{ position: 'relative', width: '82%', height: 26 }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px solid rgba(251,122,30,0.18)' }} />
                    {TRAIL_DOTS.map((pos, i) => (
                      <div key={i} className="ap-trail-dot" style={{ left: `${pos}%`, animationDelay: `${(pos / 100) * 2000}ms` }} />
                    ))}
                    <span className="ap-plane-fly">✈</span>
                  </div>
                  <p style={{ fontSize: 11, color: C.secondary, textAlign: 'center', minHeight: 16 }}>
                    {LOADING_MSGS[msgIdx]}
                  </p>
                </div>
              </div>
              <p className="text-xs mt-1 text-right" style={{ color: C.muted }}>{text.length}/280</p>
            </div>

            {/* Schedule date/time picker */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>
                Schedule for
                <span style={{ color: C.muted }}> · {fmtMDY(scheduleDate)} at {fmtTime(scheduleDate)}</span>
              </label>
              <DateTimePicker value={scheduleDate} onChange={setScheduleDate} C={C} />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleSave('draft')}
                disabled={!text.trim() || saving}
                className="text-sm px-4 py-2 rounded"
                style={{
                  backgroundColor: C.inputBg, color: C.secondary, border: `1px solid ${C.border}`,
                  opacity: !text.trim() || saving ? 0.5 : 1,
                  cursor: !text.trim() || saving ? 'default' : 'pointer',
                }}
              >Save draft</button>
              <button
                onClick={() => handleSave('published')}
                disabled={!text.trim() || saving}
                className="text-sm px-4 py-2 rounded"
                style={{
                  backgroundColor: 'rgba(22,199,132,0.12)', color: 'var(--ap-success)', border: '1px solid rgba(22,199,132,0.28)',
                  opacity: !text.trim() || saving ? 0.5 : 1,
                  cursor: !text.trim() || saving ? 'default' : 'pointer',
                }}
              >Publish now</button>
              <button
                onClick={() => handleSave('scheduled')}
                disabled={!text.trim() || saving}
                className="text-sm font-semibold px-4 py-2 rounded"
                style={{
                  backgroundColor: C.accent, color: 'var(--ap-on-accent)',
                  opacity: !text.trim() || saving ? 0.5 : 1,
                  cursor: !text.trim() || saving ? 'default' : 'pointer',
                }}
                onMouseEnter={e => { if (text.trim() && !saving) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { if (text.trim() && !saving) e.currentTarget.style.opacity = '1' }}
              >{saving ? 'Saving…' : 'Schedule'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Starter plan: frosted glass overlay blocking social posting */}
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
            <p style={{ fontSize: 30, marginBottom: 14 }}>✦</p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.primary, marginBottom: 8 }}>
              Social posting is a Growth feature
            </h3>
            <p style={{ fontSize: 13, color: C.secondary, marginBottom: 24, lineHeight: 1.65 }}>
              Upgrade to Growth to unlock AI-powered social posts, multi-platform scheduling, and automated publishing.
            </p>
            <Link
              to="/pricing"
              style={{
                display: 'inline-block', padding: '12px 28px',
                backgroundColor: C.accent, color: 'var(--ap-on-accent)',
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
