import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useApp } from '../AppContext'

// Default the schedule picker to tomorrow 10am, formatted for <input type="datetime-local">
// (which needs local 'YYYY-MM-DDTHH:mm', not an ISO/UTC string).
function defaultScheduleLocal() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STATUS_LABEL = { draft: 'Draft', scheduled: 'Scheduled', published: 'Published' }

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-US',
    { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatSchedule(row) {
  if (row.status === 'scheduled' && row.scheduled_at) return `Scheduled · ${fmtDateTime(row.scheduled_at)}`
  if (row.status === 'published') return `Published · ${fmtDateTime(row.scheduled_at || row.created_at)}`
  if (row.status === 'draft')     return 'Draft'
  return row.created_at ? fmtDateTime(row.created_at) : '—'
}

const LOADING_MSGS = [
  'AutoPilot is drafting your post…',
  'Choosing the perfect words…',
  'Almost ready for takeoff…',
  'Polishing your caption…',
]
const TRAIL_DOTS = [12, 24, 36, 50, 63, 76, 88]

const statusStyle = {
  scheduled: { bg: 'rgba(74,144,217,0.08)', color: '#4A90D9', border: 'rgba(74,144,217,0.2)' },
  published:  { bg: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'rgba(74,222,128,0.2)' },
  draft:      { bg: 'rgba(136,135,128,0.08)', color: '#888780', border: 'rgba(136,135,128,0.2)' },
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
      className="rounded-lg flex flex-col"
      style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`,
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
  const { C, userId } = useApp()

  const [posts,      setPosts]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [showForm,   setShowForm]   = useState(false)
  const [platform,   setPlatform]   = useState('Instagram')
  const [topic,      setTopic]      = useState('')
  const [text,       setText]       = useState('')
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleLocal())
  const [isLoading,  setIsLoading]  = useState(false)
  const [msgIdx,     setMsgIdx]     = useState(0)
  const [aiError,    setAiError]    = useState('')

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
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 512,
          messages: [
            { role: 'system', content: "You are a social media expert for independent restaurants. Write engaging, authentic posts that sound like a real restaurant owner wrote them — not a marketing agency. Be specific, warm, and conversational. Include relevant emojis and 3-5 hashtags." },
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
      if (!scheduledAt) { setAiError('Pick a date and time to schedule.'); return }
      scheduled_at = new Date(scheduledAt).toISOString()
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
    setSaving(false)
    if (error) { setAiError(error.message); return }
    setPosts(prev => [data, ...prev])
    handleCloseForm()
  }

  function handleCloseForm() {
    setShowForm(false); setIsLoading(false); setAiError('')
    setText(''); setTopic(''); setPlatform('Instagram'); setScheduledAt(defaultScheduleLocal())
  }

  // Called by PostCard after its exit animation finishes
  async function handleDelete(id) {
    setPosts(prev => prev.filter(p => p.id !== id))
    if (supabase) {
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
    <div className="px-8 py-8" style={{ maxWidth: 1100 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: C.primary }}>Social Posts</h1>
          <p className="text-sm" style={{ color: C.secondary }}>Scheduled and published content</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-semibold px-4 py-2 rounded transition-colors"
          style={{ backgroundColor: C.primary, color: C.bg, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + New post
        </button>
      </div>

      {loading && allPosts.length === 0 ? (
        <div className="rounded-lg overflow-hidden flex justify-center py-20"
          style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <p className="text-sm" style={{ color: C.muted }}>Loading…</p>
        </div>
      ) : allPosts.length === 0 ? (
        <div className="rounded-lg overflow-hidden"
          style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
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
          <div className="w-full rounded-lg p-8" style={{ maxWidth: 520, backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold" style={{ color: C.primary }}>New post</h2>
              <button onClick={handleCloseForm} style={{ color: C.muted, fontSize: 18, lineHeight: 1, cursor: 'pointer' }}>×</button>
            </div>

            {/* Platform */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>Platform</label>
              <div className="flex gap-2">
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
                    backgroundColor: 'rgba(74,144,217,0.1)', color: '#4A90D9',
                    border: '1px solid rgba(74,144,217,0.2)',
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
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px solid rgba(74,144,217,0.18)' }} />
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

            {/* Schedule time picker */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>
                Schedule for
                <span style={{ color: C.muted }}> (used when you click Schedule)</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded outline-none"
                style={{ backgroundColor: C.inputBg, color: C.primary, border: `1px solid ${C.border}`, colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = C.secondary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
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
                  backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)',
                  opacity: !text.trim() || saving ? 0.5 : 1,
                  cursor: !text.trim() || saving ? 'default' : 'pointer',
                }}
              >Publish now</button>
              <button
                onClick={() => handleSave('scheduled')}
                disabled={!text.trim() || saving}
                className="text-sm font-semibold px-4 py-2 rounded"
                style={{
                  backgroundColor: C.primary, color: C.bg,
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
    </div>
  )
}
