import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const ADMIN_EMAIL = 'bray.200913@gmail.com'
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL ?? '/api/webhook'

const C = {
  bg: '#05070D', card: '#0E1420', border: '#2E2A24', divider: '#211E19',
  primary: '#EAF2FF', secondary: '#94A3B8', muted: '#5B6678',
  accent: '#22D3EE', inputBg: '#131110',
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Row({ label, value, mono = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0' }}>
      <span style={{ fontSize: 12, color: C.secondary }}>{label}</span>
      <span style={{ fontSize: 13, color: C.primary, fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function Sep() {
  return <div style={{ height: 1, backgroundColor: C.divider, margin: '10px 0' }} />
}

function Section({ title, children }) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 16 }}>
      <div style={{ padding: '14px 24px', borderBottom: `1px solid ${C.divider}` }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.primary, letterSpacing: '0.02em' }}>{title}</p>
      </div>
      <div style={{ padding: '18px 24px' }}>{children}</div>
    </div>
  )
}

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false)
  function doCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={doCopy} style={{
      fontSize: 11, padding: '3px 8px', borderRadius: 4, border: 'none',
      backgroundColor: copied ? 'rgba(34,211,238,0.14)' : 'rgba(163,155,142,0.12)',
      color: copied ? '#67E8F9' : C.secondary,
      cursor: 'pointer', flexShrink: 0,
    }}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ── Main admin view ───────────────────────────────────────────────────────────

export default function Admin() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [query,     setQuery]     = useState('')
  const [searching, setSearching] = useState(false)
  const [result,    setResult]    = useState(null)
  const [notFound,  setNotFound]  = useState(false)
  const [searchErr, setSearchErr] = useState('')

  useEffect(() => {
    if (!loading && user?.email !== ADMIN_EMAIL) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 13, color: C.muted }}>Loading…</p>
      </div>
    )
  }

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 13, color: '#F0524B' }}>Access denied</p>
      </div>
    )
  }

  async function handleSearch(e) {
    e.preventDefault()
    const name = query.trim()
    if (!name) return
    if (!supabase) { setSearchErr('Supabase not configured.'); return }

    setSearching(true)
    setResult(null)
    setNotFound(false)
    setSearchErr('')

    try {
      const [msgRes, reviewRes, actRes] = await Promise.all([
        supabase
          .from('messages')
          .select('id, restaurant_name, created_at')
          .ilike('restaurant_name', `%${name}%`)
          .order('created_at', { ascending: true }),
        supabase
          .from('reviews')
          .select('id, status, created_at')
          .order('created_at', { ascending: true }),
        supabase
          .from('activity_feed')
          .select('id, type, created_at')
          .eq('type', 'post_scheduled')
          .order('created_at', { ascending: true }),
      ])

      const msgs = msgRes.data ?? []
      const reviews = reviewRes.data ?? []
      const acts = actRes.data ?? []

      if (msgs.length === 0 && reviews.length === 0) {
        setNotFound(true)
        return
      }

      const actualName  = msgs[0]?.restaurant_name ?? name
      const firstSeen   = msgs[0]?.created_at ?? null
      const msgCount    = msgs.length
      const repliedCount = reviews.filter(r => r.status === 'replied').length
      const postCount   = acts.length

      setResult({ name: actualName, firstSeen, msgCount, repliedCount, postCount })
    } catch (err) {
      setSearchErr(err.message || 'Search failed.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, padding: '40px 32px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M16 2L9.5 8.5M16 2L11 16L9.5 8.5M16 2L2 6.5L9.5 8.5"
                stroke={C.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              AutoPilot Admin
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: C.primary, marginBottom: 4 }}>
            Restaurant lookup
          </h1>
          <p style={{ fontSize: 13, color: C.secondary }}>
            Internal tools — not visible to customers
          </p>
        </div>

        {/* Search */}
        <Section title="Search">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Restaurant name…"
              style={{
                flex: 1, fontSize: 13, padding: '9px 13px', borderRadius: 7,
                backgroundColor: C.inputBg, color: C.primary,
                border: `1px solid ${C.border}`, outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = C.secondary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <button
              type="submit"
              disabled={!query.trim() || searching}
              style={{
                padding: '9px 22px', borderRadius: 7, border: 'none',
                backgroundColor: C.accent, color: '#04141A',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                opacity: (!query.trim() || searching) ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>
          {notFound && (
            <p style={{ fontSize: 12, color: C.muted, marginTop: 12 }}>
              No records found for "{query}".
            </p>
          )}
          {searchErr && (
            <p style={{ fontSize: 12, color: '#F0524B', marginTop: 12 }}>{searchErr}</p>
          )}
        </Section>

        {result && (
          <>
            {/* Account details */}
            <Section title="Account details">
              <Row label="Business name"  value={result.name} />
              <Sep />
              <Row label="Email"          value="—" />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                Email lookup requires querying Supabase auth (service-key only)
              </p>
              <Sep />
              <Row
                label="First activity"
                value={result.firstSeen
                  ? new Date(result.firstSeen).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : '—'}
              />
            </Section>

            {/* Webhook */}
            <Section title="Make.com Webhook">
              <p style={{ fontSize: 12, color: C.secondary, marginBottom: 10 }}>
                Paste this URL as the webhook target in their Make.com scenario.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 7,
                backgroundColor: C.inputBg, border: `1px solid ${C.border}`,
              }}>
                <span style={{
                  flex: 1, fontSize: 12, fontFamily: 'monospace', color: C.secondary,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {WEBHOOK_URL}
                </span>
                <CopyBtn value={WEBHOOK_URL} />
              </div>
            </Section>

            {/* Supabase stats */}
            <Section title="Supabase data">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
                {[
                  { label: 'Reviews replied', value: result.repliedCount },
                  { label: 'Posts scheduled',  value: result.postCount    },
                  { label: 'Messages sent',    value: result.msgCount     },
                ].map((s, i, arr) => (
                  <div key={s.label} style={{
                    padding: '4px 16px 4px 0',
                    borderRight: i < arr.length - 1 ? `1px solid ${C.divider}` : 'none',
                    marginRight: i < arr.length - 1 ? 16 : 0,
                  }}>
                    <p style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {s.label}
                    </p>
                    <p style={{ fontSize: 30, fontWeight: 600, color: C.primary }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
