import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../AppContext'
import { supabase } from '../../lib/supabase'
import { getPlanMeta } from '../planMeta'
import Select from '../components/Select'

const REPLY_SPEED_OPTIONS = [
  { value: 'instant',    label: 'Instant',        desc: 'replies as soon as a review comes in' },
  { value: 'within_1h',  label: 'Within 1 hour',  desc: 'replies within 1 hour of a new review' },
  { value: 'within_4h',  label: 'Within 4 hours', desc: 'replies within 4 hours of a new review' },
  { value: 'within_24h', label: 'Within 24 hours', desc: 'replies within 24 hours of a new review' },
  { value: 'manual',     label: 'Manual',          desc: 'waits for your approval before sending each reply' },
]

const POST_TONE_OPTIONS = [
  { value: 'friendly',    label: 'Friendly & casual'  },
  { value: 'professional', label: 'Professional'       },
  { value: 'energetic',   label: 'Energetic & fun'    },
]

function SelectField({ label, value, onChange, options, C }) {
  return <Select label={label} value={value} onChange={onChange} options={options} C={C} />
}

function CopyButton({ value, C }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="shrink-0 text-xs px-2 py-0.5 rounded transition-colors"
      style={{
        backgroundColor: copied ? 'rgba(34,211,238,0.12)' : 'rgba(136,135,128,0.1)',
        color: copied ? 'var(--ap-success)' : C.secondary,
        border: `1px solid ${copied ? 'rgba(34,211,238,0.22)' : 'rgba(136,135,128,0.2)'}`,
        cursor: 'pointer',
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function Toggle({ checked, onChange, C }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        backgroundColor: checked ? 'var(--ap-accent)' : C.border,
        position: 'relative', transition: 'background-color 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        backgroundColor: checked ? '#fff' : C.secondary,
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

function Card({ title, children, C }) {
  return (
    <div style={{
      backgroundColor: C.card, border: `1px solid ${C.border}`,
      borderRadius: 16, overflow: 'hidden', marginBottom: 24,
      backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
      boxShadow: C.cardShadow,
    }}>
      <div className="px-6 py-4" style={{ borderBottom: `1px solid ${C.divider}` }}>
        <h2 className="text-sm font-semibold" style={{ color: C.primary }}>{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', C }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm px-4 py-2.5 rounded outline-none"
        style={{ backgroundColor: C.inputBg, color: C.primary, border: `1px solid ${C.border}` }}
        onFocus={e => e.target.style.borderColor = C.secondary}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  )
}

const ADMIN_EMAIL = 'bray.200913@gmail.com'

// Converts "14:30" → { h: 2, m: 30, ap: 'PM' }
function parse24(t) {
  const [hh, mm] = (t || '09:00').split(':').map(Number)
  const ap = hh >= 12 ? 'PM' : 'AM'
  const h = hh % 12 || 12
  return { h, m: mm, ap }
}
// Converts { h, m, ap } → "14:30"
function to24({ h, m, ap }) {
  let hh = h % 12
  if (ap === 'PM') hh += 12
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function TimePicker({ label, value, onChange, C }) {
  const { h, m, ap } = parse24(value)
  const set = (patch) => onChange(to24({ h, m, ap, ...patch }))
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>{label}</label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Select
            value={h}
            onChange={v => set({ h: Number(v) })}
            C={C} small
            options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
          />
        </div>
        <span style={{ color: C.muted, fontSize: 16, fontWeight: 300, flexShrink: 0 }}>:</span>
        <div style={{ flex: 1 }}>
          <Select
            value={m}
            onChange={v => set({ m: Number(v) })}
            C={C} small
            options={Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: String(i * 5).padStart(2, '0') }))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Select
            value={ap}
            onChange={v => set({ ap: v })}
            C={C} small
            options={[{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }]}
          />
        </div>
      </div>
    </div>
  )
}

const API_URL = import.meta.env.VITE_API_URL || 'https://autopilot-production-7671.up.railway.app'

export default function Settings() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { C, theme, toggleTheme, restaurantName, setRestaurantName, userId, plan } = useApp()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? '')
    })
  }, [])

  const planMeta = getPlanMeta(plan)

  // Personal webhook URL — includes this restaurant's user_id so Make.com data
  // lands on the right account. Points at the deployed Railway backend.
  const webhookUrl = userId
    ? `https://autopilot-production-7671.up.railway.app/api/webhook?user_id=${userId}`
    : null

  // Controlled form fields — seed from context/localStorage
  const [name,    setName]    = useState(restaurantName)
  const [address, setAddress] = useState(() => localStorage.getItem('ap_address') || '142 North St, San Francisco, CA 94103')
  const [phone,   setPhone]   = useState(() => localStorage.getItem('ap_phone')   || '(415) 555-0182')
  const [website, setWebsite] = useState(() => localStorage.getItem('ap_website') || 'mariostrattoria.com')

  const [saved,      setSaved]      = useState(false)
  const [prefSaved,  setPrefSaved]  = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)
  const [notifs,     setNotifs]     = useState({ alerts: true })
  const [notifEmail, setNotifEmail] = useState('')

  // ── Cancel flow ───────────────────────────────────────────────────────────
  const [cancelStep,   setCancelStep]   = useState(null)  // null | 'survey' | 'loading'
  const [cancelReason, setCancelReason] = useState('')

  // ── Business hours ────────────────────────────────────────────────────────
  const [bizHoursEnabled, setBizHoursEnabled] = useState(true)
  const [bizOpen,         setBizOpen]         = useState('09:00')
  const [bizClose,        setBizClose]        = useState('21:00')
  const [bizTimezone,     setBizTimezone]     = useState('America/New_York')
  const [bizSaved,        setBizSaved]        = useState(false)

  // ── Automation preferences ────────────────────────────────────────────────
  const [replySpeed,      setReplySpeed]      = useState('within_1h')
  const [postTone,        setPostTone]        = useState('friendly')
  const [autoPostEnabled, setAutoPostEnabled] = useState(true)
  const [prefsLoading,    setPrefsLoading]    = useState(false)

  // Load saved preferences from Supabase profiles on mount / when user id resolves
  useEffect(() => {
    if (!supabase || !userId) return
    supabase.from('profiles')
      .select('reply_speed, post_tone, auto_post_enabled, business_hours, notification_prefs')
      .eq('id', userId).single()
      .then(({ data }) => {
        if (!data) return
        if (data.reply_speed       != null) setReplySpeed(data.reply_speed)
        if (data.post_tone         != null) setPostTone(data.post_tone)
        if (data.auto_post_enabled != null) setAutoPostEnabled(data.auto_post_enabled)
        if (data.business_hours) {
          const bh = data.business_hours
          if (bh.enabled  != null) setBizHoursEnabled(bh.enabled)
          if (bh.open)              setBizOpen(bh.open)
          if (bh.close)             setBizClose(bh.close)
          if (bh.timezone)          setBizTimezone(bh.timezone)
        }
        if (data.notification_prefs) {
          const np = data.notification_prefs
          setNotifs({ alerts: np.alerts ?? true })
          if (np.phone_email) setNotifEmail(np.phone_email)
        }
      })
  }, [userId])

  async function handlePrefsSave() {
    if (!supabase || !userId) return
    setPrefsLoading(true)
    const { error } = await supabase.from('profiles').upsert({
      id:                userId,
      reply_speed:       replySpeed,
      post_tone:         postTone,
      auto_post_enabled: autoPostEnabled,
    })
    setPrefsLoading(false)
    if (!error) { setPrefSaved(true); setTimeout(() => setPrefSaved(false), 2500) }
    else console.error('[Settings] prefs save:', error.message)
  }

  async function handleBizHoursSave() {
    if (!supabase || !userId) return
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      business_hours: { enabled: bizHoursEnabled, open: bizOpen, close: bizClose, timezone: bizTimezone },
    })
    if (!error) { setBizSaved(true); setTimeout(() => setBizSaved(false), 2500) }
    else console.error('[Settings] biz hours save:', error.message)
  }

  async function handleNotifSave() {
    if (!supabase || !userId) return
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      notification_prefs: {
        alerts: notifs.alerts,
        phone_email: notifEmail.trim(),
      },
    })
    if (!error) { setNotifSaved(true); setTimeout(() => setNotifSaved(false), 2500) }
    else console.error('[Settings] notif save:', error.message)
  }

  async function handleCancelPortal() {
    setCancelStep('loading')
    try {
      // Store cancel reason before redirecting
      if (cancelReason && supabase && userId) {
        await supabase.from('profiles').upsert({ id: userId, cancel_reason: cancelReason, cancel_reason_at: new Date().toISOString() })
      }
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://autopilot-production-7671.up.railway.app'}/api/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ userId: session?.user?.id }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else { setCancelStep('survey'); alert(json.error ?? 'Could not open billing portal. Contact support.') }
    } catch {
      setCancelStep('survey')
      alert('Failed to open billing portal. Please try again.')
    }
  }

  // Connection status — seeded from Supabase (Google) + localStorage (Instagram/Facebook)
  function loadConnections(rName) {
    try { return JSON.parse(localStorage.getItem(`ap_connections_${rName}`)) ?? {} } catch { return {} }
  }
  const [connections, setConnections] = useState(() => loadConnections(restaurantName))

  // Multi-location picker
  const [chooseLocation,     setChooseLocation]     = useState(false)
  const [googleLocations,    setGoogleLocations]    = useState([])
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [locationSaving,     setLocationSaving]     = useState(false)

  // On mount: check Supabase for real Google connection status
  useEffect(() => {
    if (!userId) return
    supabase.from('profiles').select('google_access_token').eq('id', userId).single()
      .then(({ data }) => {
        const isConnected = !!data?.google_access_token
        setConnections(prev => {
          const next = { ...prev, google: isConnected }
          localStorage.setItem(`ap_connections_${restaurantName}`, JSON.stringify(next))
          return next
        })
      })
  }, [userId])

  // Handle ?google_connected=true and ?choose_location=true redirect from OAuth callback
  useEffect(() => {
    if (searchParams.get('google_connected') !== 'true') return

    // Mark Google as connected in local state
    setConnections(prev => {
      const next = { ...prev, google: true }
      localStorage.setItem(`ap_connections_${restaurantName}`, JSON.stringify(next))
      return next
    })

    if (searchParams.get('choose_location') === 'true' && userId) {
      // Multi-location: load all locations and show picker
      supabase.from('profiles')
        .select('google_locations, google_location_id')
        .eq('id', userId).single()
        .then(({ data }) => {
          const locs = data?.google_locations ?? []
          if (locs.length > 1) {
            setGoogleLocations(locs)
            setSelectedLocationId(data?.google_location_id ?? locs[0]?.id ?? '')
            setChooseLocation(true)
          }
        })
    }

    setSearchParams({}, { replace: true })
  }, [searchParams, userId])

  async function handleSelectLocation() {
    if (!selectedLocationId || !userId) return
    setLocationSaving(true)
    try {
      await fetch(`${API_URL}/api/auth/google/select-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, location_id: selectedLocationId }),
      })
      setChooseLocation(false)
    } catch (err) {
      console.error('Failed to save location:', err)
    } finally {
      setLocationSaving(false)
    }
  }

  async function setConnected(service, value) {
    const next = { ...connections, [service]: value }
    setConnections(next)
    localStorage.setItem(`ap_connections_${restaurantName}`, JSON.stringify(next))
    // For Google: clear tokens in Supabase when disconnecting
    if (service === 'google' && !value && userId) {
      await supabase.from('profiles').update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expires_at: null,
        google_account_id: null,
        google_location_id: null,
        google_connected_at: null,
      }).eq('id', userId)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    // setRestaurantName also updates Supabase auth metadata + profiles table
    await setRestaurantName(name.trim() || 'Your Restaurant')
    localStorage.setItem('ap_address', address)
    localStorage.setItem('ap_phone',   phone)
    localStorage.setItem('ap_website', website)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="ap-page px-8 py-8" style={{ maxWidth: 660 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: C.primary, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Settings</h1>
        <p className="text-sm" style={{ color: C.secondary }}>Manage your restaurant account</p>
      </div>

      {/* Restaurant info */}
      <Card title="Restaurant" C={C}>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Restaurant name" value={name}    onChange={setName}    C={C} />
          <Field label="Address"         value={address} onChange={setAddress} C={C} />
          <Field label="Phone"           value={phone}   onChange={setPhone}   type="tel" C={C} />
          <Field label="Website"         value={website} onChange={setWebsite} C={C} />

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="text-sm font-semibold px-5 py-2 rounded transition-colors"
              style={{ backgroundColor: C.accent, color: 'var(--ap-on-accent)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Save changes
            </button>
            {saved && <span className="text-xs" style={{ color: 'var(--ap-success)' }}>✓ Saved</span>}
          </div>
        </form>
      </Card>

      {/* Billing / subscription */}
      <Card title="Billing" C={C}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: C.secondary }}>Current plan</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: planMeta.color }}>
                {planMeta.emoji ? `${planMeta.emoji} ` : ''}{planMeta.label} plan
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                padding: '1px 7px', borderRadius: 980,
                background: 'rgba(34,211,238,0.14)', color: 'var(--ap-success)',
                border: '1px solid rgba(34,211,238,0.30)',
              }}>ACTIVE</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/subscription')}
            className="shrink-0 text-sm font-semibold px-5 py-2 rounded transition-colors"
            style={{
              backgroundColor: C.inputBg, color: C.primary,
              border: `1px solid ${C.border}`, cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.secondary}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            Manage
          </button>
        </div>
      </Card>

      {/* Appearance */}
      <Card title="Appearance" C={C}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: C.primary }}>
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.secondary }}>
              {theme === 'dark'
                ? 'Switch to a lighter look for daytime use'
                : 'Switch back to the classic dark theme'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="text-sm px-4 py-2 rounded flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: C.inputBg, color: C.primary,
              border: `1px solid ${C.border}`, cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.secondary}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            {theme === 'dark' ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                Light mode
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
                Dark mode
              </>
            )}
          </button>
        </div>
      </Card>

      {/* Connected accounts */}
      <Card title="Connected accounts" C={C}>
        <div className="space-y-4">

          {/* Google Business Profile */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>Google Business Profile</p>
              <p className="text-xs mt-0.5" style={{ color: C.secondary }}>
                {connections.google ? 'Reviews syncing automatically' : 'Connect to enable review replies'}
              </p>
            </div>
            {connections.google ? (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded"
                  style={{ backgroundColor: 'rgba(34,211,238,0.10)', color: 'var(--ap-success)', border: '1px solid rgba(34,211,238,0.2)' }}>
                  ✓ Connected
                </span>
                <button
                  onClick={() => setConnected('google', false)}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ color: C.muted, border: `1px solid ${C.border}`, backgroundColor: 'transparent', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={e => e.currentTarget.style.color = C.muted}
                >Disconnect</button>
              </div>
            ) : (
              <button
                onClick={() => {
                  window.location.href = `${API_URL}/api/auth/google/connect?user_id=${userId}`
                }}
                className="text-xs px-3 py-1.5 rounded font-medium"
                style={{ backgroundColor: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >Connect</button>
            )}
          </div>

          <div className="h-px" style={{ backgroundColor: C.divider }} />

          {/* Instagram */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>Instagram</p>
              <p className="text-xs mt-0.5" style={{ color: C.secondary }}>
                {connections.instagram ? 'Posts publishing automatically' : 'Connect to enable auto-posting'}
              </p>
            </div>
            {connections.instagram ? (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded"
                  style={{ backgroundColor: 'rgba(34,211,238,0.10)', color: 'var(--ap-success)', border: '1px solid rgba(34,211,238,0.2)' }}>
                  ✓ Connected
                </span>
                <button
                  onClick={() => setConnected('instagram', false)}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ color: C.muted, border: `1px solid ${C.border}`, backgroundColor: 'transparent', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={e => e.currentTarget.style.color = C.muted}
                >Disconnect</button>
              </div>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded" style={{ color: C.muted, border: `1px solid ${C.border}` }}>
                Coming soon
              </span>
            )}
          </div>

          <div className="h-px" style={{ backgroundColor: C.divider }} />

          {/* Facebook */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>Facebook</p>
              <p className="text-xs mt-0.5" style={{ color: C.secondary }}>
                {connections.facebook ? 'Posts publishing automatically' : 'Connect to enable auto-posting'}
              </p>
            </div>
            {connections.facebook ? (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded"
                  style={{ backgroundColor: 'rgba(34,211,238,0.10)', color: 'var(--ap-success)', border: '1px solid rgba(34,211,238,0.2)' }}>
                  ✓ Connected
                </span>
                <button
                  onClick={() => setConnected('facebook', false)}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ color: C.muted, border: `1px solid ${C.border}`, backgroundColor: 'transparent', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={e => e.currentTarget.style.color = C.muted}
                >Disconnect</button>
              </div>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded" style={{ color: C.muted, border: `1px solid ${C.border}` }}>
                Coming soon
              </span>
            )}
          </div>

        </div>
      </Card>

      {/* Automation preferences */}
      <Card title="Automation preferences" C={C}>
        <div className="space-y-5">

          {/* Review reply speed */}
          <div>
            <SelectField
              label="Review reply speed"
              value={replySpeed}
              onChange={setReplySpeed}
              options={REPLY_SPEED_OPTIONS}
              C={C}
            />
            <p className="text-xs mt-1.5" style={{ color: C.primary }}>
              AutoPilot will reply to new Google reviews{' '}
              <span style={{ color: C.primary }}>
                {REPLY_SPEED_OPTIONS.find(o => o.value === replySpeed)?.desc ?? '…'}
              </span>
            </p>
          </div>

          <div className="h-px" style={{ backgroundColor: C.divider }} />

          {/* Post tone */}
          <div>
            <SelectField
              label="Post tone"
              value={postTone}
              onChange={setPostTone}
              options={POST_TONE_OPTIONS}
              C={C}
            />
            <p className="text-xs mt-1.5" style={{ color: C.primary }}>
              AI-generated social posts will match this writing style.
            </p>
          </div>

          <div className="h-px" style={{ backgroundColor: C.divider }} />

          {/* Auto-post schedule */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>Auto-post schedule</p>
              <p className="text-xs mt-0.5" style={{ color: C.primary }}>
                {autoPostEnabled
                  ? 'When on, AutoPilot posts automatically.'
                  : 'When off, posts need your approval before publishing.'}
              </p>
            </div>
            <Toggle checked={autoPostEnabled} onChange={setAutoPostEnabled} C={C} />
          </div>

          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrefsSave}
              disabled={prefsLoading}
              className="text-sm font-semibold px-5 py-2 rounded transition-colors"
              style={{
                backgroundColor: C.accent,
                color: 'var(--ap-on-accent)',
                cursor: prefsLoading ? 'default' : 'pointer',
                opacity: prefsLoading ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!prefsLoading) e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { if (!prefsLoading) e.currentTarget.style.opacity = '1' }}
            >
              {prefsLoading ? 'Saving…' : 'Save preferences'}
            </button>
            {prefSaved && <span className="text-xs" style={{ color: 'var(--ap-success)' }}>✓ Saved</span>}
          </div>

        </div>
      </Card>

      {/* Business hours */}
      <Card title="Business hours" C={C}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>Restrict reply times</p>
              <p className="text-xs mt-0.5" style={{ color: C.secondary }}>Only auto-post replies during your open hours</p>
            </div>
            <Toggle checked={bizHoursEnabled} onChange={setBizHoursEnabled} C={C} />
          </div>

          {bizHoursEnabled && (
            <>
              <div className="h-px" style={{ backgroundColor: C.divider }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <TimePicker label="Opens"  value={bizOpen}  onChange={setBizOpen}  C={C} />
                <TimePicker label="Closes" value={bizClose} onChange={setBizClose} C={C} />
              </div>
              <div>
                <Select
                  label="Timezone"
                  value={bizTimezone}
                  onChange={setBizTimezone}
                  C={C}
                  options={[
                    { value: 'America/New_York',    label: 'Eastern (ET)' },
                    { value: 'America/Chicago',      label: 'Central (CT)' },
                    { value: 'America/Denver',       label: 'Mountain (MT)' },
                    { value: 'America/Los_Angeles',  label: 'Pacific (PT)' },
                    { value: 'America/Phoenix',      label: 'Arizona (MST)' },
                    { value: 'America/Anchorage',    label: 'Alaska (AKT)' },
                    { value: 'Pacific/Honolulu',     label: 'Hawaii (HST)' },
                    { value: 'Europe/London',        label: 'London (GMT/BST)' },
                    { value: 'Europe/Paris',         label: 'Paris (CET)' },
                    { value: 'Australia/Sydney',     label: 'Sydney (AEST)' },
                  ]}
                />
              </div>
            </>
          )}

          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={handleBizHoursSave}
              className="text-sm font-semibold px-5 py-2 rounded"
              style={{ backgroundColor: C.accent, color: 'var(--ap-on-accent)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Save hours
            </button>
            {bizSaved && <span className="text-xs" style={{ color: 'var(--ap-success)' }}>✓ Saved</span>}
          </div>
        </div>
      </Card>

      {/* Notifications — admin only */}
      {userEmail === ADMIN_EMAIL && <Card title="Notifications" C={C}>
        <div className="space-y-4">
          {/* System alerts — the only live toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>System alerts</p>
              <p className="text-xs mt-0.5" style={{ color: C.secondary }}>If AutoPilot pauses or needs attention</p>
            </div>
            <Toggle checked={notifs.alerts} onChange={v => setNotifs(n => ({ ...n, alerts: v }))} C={C} />
          </div>

          <div className="h-px" style={{ backgroundColor: C.divider }} />

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>
              Email address for alerts
            </label>
            <input
              type="email"
              value={notifEmail}
              onChange={e => setNotifEmail(e.target.value)}
              placeholder="you@restaurant.com"
              className="w-full text-sm px-4 py-2.5 rounded outline-none"
              style={{ backgroundColor: C.inputBg, color: C.primary, border: `1px solid ${C.border}` }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          <div className="pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={handleNotifSave}
              className="text-sm font-semibold px-5 py-2 rounded"
              style={{ backgroundColor: C.accent, color: 'var(--ap-on-accent)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Save
            </button>
            {notifSaved && <span className="text-xs" style={{ color: 'var(--ap-success)' }}>✓ Saved</span>}
          </div>
        </div>
      </Card>}

      {/* Danger zone */}
      <div style={{
        backgroundColor: C.card, border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 16, overflow: 'hidden',
        backdropFilter: C.glassFilter, WebkitBackdropFilter: C.glassFilter,
        boxShadow: C.cardShadow,
      }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'rgb(239,68,68)' }}>Danger zone</h2>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: C.primary }}>Cancel subscription</p>
            <p className="text-xs mt-0.5" style={{ color: C.secondary }}>
              Your account will remain active until the end of the billing period.
            </p>
          </div>
          <button
            onClick={() => setCancelStep('survey')}
            className="text-sm font-medium px-4 py-2 rounded"
            style={{ color: 'rgb(239,68,68)', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)'}
          >
            Cancel subscription
          </button>
        </div>
      </div>

      {/* Location picker modal */}
      {chooseLocation && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div style={{ width: '100%', maxWidth: 440, backgroundColor: C.card, borderRadius: 20, padding: '32px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }}>
            <p className="text-base font-semibold mb-1" style={{ color: C.primary }}>Choose your location</p>
            <p className="text-xs mb-5" style={{ color: C.secondary }}>
              Your Google account manages multiple Business Profiles. Pick the one AutoPilot should monitor for reviews.
            </p>
            <div className="space-y-2">
              {googleLocations.map(loc => (
                <label key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', backgroundColor: selectedLocationId === loc.id ? 'rgba(34,211,238,0.08)' : C.inputBg, border: `1px solid ${selectedLocationId === loc.id ? 'rgba(34,211,238,0.3)' : C.border}` }}>
                  <input
                    type="radio"
                    name="locationPicker"
                    value={loc.id}
                    checked={selectedLocationId === loc.id}
                    onChange={() => setSelectedLocationId(loc.id)}
                    style={{ accentColor: C.accent, width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span className="text-sm" style={{ color: C.primary }}>{loc.name}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSelectLocation}
                disabled={locationSaving}
                className="text-sm font-semibold px-5 py-2.5 rounded"
                style={{ backgroundColor: C.accent, color: 'var(--ap-on-accent)', cursor: locationSaving ? 'not-allowed' : 'pointer', opacity: locationSaving ? 0.6 : 1 }}
              >
                {locationSaving ? 'Saving…' : 'Confirm location'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal overlay */}
      {cancelStep && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setCancelStep(null) }}
        >
          <div style={{ width: '100%', maxWidth: 460, backgroundColor: C.card, borderRadius: 20, padding: '32px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }}>
            {/* Pause option */}
            <div style={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: C.primary }}>Pause for 30 days instead</p>
                <p className="text-xs mt-0.5" style={{ color: C.secondary }}>No charge, your data stays safe, resume anytime.</p>
              </div>
              <button
                onClick={async () => {
                  if (!supabase || !userId) return
                  await supabase.from('profiles').upsert({ id: userId, subscription_status: 'paused', paused_until: new Date(Date.now() + 30 * 86400000).toISOString() })
                  setCancelStep(null)
                  alert('Your account is paused for 30 days. We\'ll remind you before it resumes.')
                }}
                className="text-sm font-semibold px-4 py-2 rounded whitespace-nowrap"
                style={{ backgroundColor: C.accent, color: 'var(--ap-on-accent)', cursor: 'pointer', flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Pause instead
              </button>
            </div>

            <p className="text-base font-semibold mb-1" style={{ color: C.primary }}>Before you go — what happened?</p>
            <p className="text-xs mb-4" style={{ color: C.secondary }}>Optional. Your answer helps us improve AutoPilot.</p>

            {[
              'Too expensive',
              'Switching to another tool',
              'Not using it enough',
              'Missing a feature I need',
              'Other',
            ].map(reason => (
              <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="cancelReason"
                  value={reason}
                  checked={cancelReason === reason}
                  onChange={() => setCancelReason(reason)}
                  style={{ accentColor: C.accent, width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
                />
                <span className="text-sm" style={{ color: C.primary }}>{reason}</span>
              </label>
            ))}

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleCancelPortal}
                disabled={cancelStep === 'loading'}
                className="text-sm font-semibold px-5 py-2.5 rounded"
                style={{ backgroundColor: 'rgb(239,68,68)', color: '#fff', cursor: cancelStep === 'loading' ? 'not-allowed' : 'pointer', opacity: cancelStep === 'loading' ? 0.6 : 1 }}
              >
                {cancelStep === 'loading' ? 'Opening portal…' : 'Continue to cancel'}
              </button>
              <button
                onClick={() => { setCancelStep(null); setCancelReason('') }}
                className="text-sm px-4 py-2.5 rounded"
                style={{ color: C.secondary, border: `1px solid ${C.border}`, cursor: 'pointer', backgroundColor: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.inputBg}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Never mind
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
