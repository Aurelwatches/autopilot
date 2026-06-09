import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'
import { supabase } from '../../lib/supabase'
import { getPlanMeta } from '../planMeta'

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
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm px-4 py-2.5 rounded outline-none"
        style={{
          backgroundColor: C.inputBg, color: C.primary,
          border: `1px solid ${C.border}`, cursor: 'pointer',
        }}
        onFocus={e => e.target.style.borderColor = C.secondary}
        onBlur={e => e.target.style.borderColor = C.border}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
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
        backgroundColor: copied ? 'rgba(74,222,128,0.1)' : 'rgba(136,135,128,0.1)',
        color: copied ? '#4ade80' : C.secondary,
        border: `1px solid ${copied ? 'rgba(74,222,128,0.2)' : 'rgba(136,135,128,0.2)'}`,
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
        backgroundColor: checked ? '#4A90D9' : C.border,
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

export default function Settings() {
  const navigate = useNavigate()
  const { C, theme, toggleTheme, restaurantName, setRestaurantName, userId, plan } = useApp()

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
  const [notifs,     setNotifs]     = useState({ email: true, sms: false, weekly: true, alerts: true })

  // ── Automation preferences ────────────────────────────────────────────────
  const [replySpeed,     setReplySpeed]     = useState('within_1h')
  const [postTone,       setPostTone]       = useState('friendly')
  const [autoPostEnabled, setAutoPostEnabled] = useState(true)
  const [prefsLoading,   setPrefsLoading]   = useState(false)

  // Load saved preferences from Supabase profiles on mount / when user id resolves
  useEffect(() => {
    if (!supabase || !userId) return
    supabase.from('profiles').select('reply_speed, post_tone, auto_post_enabled')
      .eq('id', userId).single()
      .then(({ data }) => {
        if (!data) return
        if (data.reply_speed      != null) setReplySpeed(data.reply_speed)
        if (data.post_tone        != null) setPostTone(data.post_tone)
        if (data.auto_post_enabled != null) setAutoPostEnabled(data.auto_post_enabled)
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

  // Connection status — stored per restaurant name, default all false
  function loadConnections(rName) {
    try { return JSON.parse(localStorage.getItem(`ap_connections_${rName}`)) ?? {} } catch { return {} }
  }
  const [connections, setConnections] = useState(() => loadConnections(restaurantName))

  function setConnected(service, value) {
    const next = { ...connections, [service]: value }
    setConnections(next)
    localStorage.setItem(`ap_connections_${restaurantName}`, JSON.stringify(next))
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
        <h1 className="text-2xl font-semibold mb-1" style={{ color: C.primary }}>Settings</h1>
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
              style={{ backgroundColor: C.primary, color: 'var(--ap-bg)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Save changes
            </button>
            {saved && <span className="text-xs" style={{ color: '#4ade80' }}>✓ Saved</span>}
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
                background: 'rgba(34,197,94,0.14)', color: '#22C55E',
                border: '1px solid rgba(34,197,94,0.30)',
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
                  style={{ backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>
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
                onClick={() => window.open('https://accounts.google.com/o/oauth2/auth', '_blank')}
                className="text-xs px-3 py-1.5 rounded font-medium"
                style={{ backgroundColor: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >Connect</button>
            )}
          </div>

          <div className="h-px" style={{ backgroundColor: C.divider }} />

          {/* Make.com webhook */}
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: C.primary }}>Make.com Webhook</p>
            <p className="text-xs mb-2" style={{ color: C.secondary }}>
              Paste this URL as the webhook target in your Make.com scenario. It's
              unique to your restaurant — reviews and posts sent here land on your account.
            </p>
            {webhookUrl ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded text-xs font-mono"
                style={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}`, color: C.secondary }}>
                <span className="flex-1 truncate">{webhookUrl}</span>
                <CopyButton value={webhookUrl} C={C} />
              </div>
            ) : (
              <div className="px-3 py-2.5 rounded"
                style={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}` }}>
                <p className="text-xs font-medium" style={{ color: C.secondary }}>
                  Sign in to see your webhook URL
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                  We add your account ID to the URL so your data routes correctly
                </p>
              </div>
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
                  style={{ backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>
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
              <button
                onClick={() => window.open('https://www.instagram.com/oauth/authorize', '_blank')}
                className="text-xs px-3 py-1.5 rounded font-medium"
                style={{ backgroundColor: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >Connect</button>
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
                  style={{ backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>
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
              <button
                onClick={() => window.open('https://www.facebook.com/v18.0/dialog/oauth', '_blank')}
                className="text-xs px-3 py-1.5 rounded font-medium"
                style={{ backgroundColor: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >Connect</button>
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
            <p className="text-xs mt-1.5" style={{ color: C.muted }}>
              AutoPilot will reply to new Google reviews{' '}
              <span style={{ color: C.secondary }}>
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
            <p className="text-xs mt-1.5" style={{ color: C.muted }}>
              AI-generated social posts will match this writing style.
            </p>
          </div>

          <div className="h-px" style={{ backgroundColor: C.divider }} />

          {/* Auto-post schedule */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>Auto-post schedule</p>
              <p className="text-xs mt-0.5" style={{ color: C.secondary }}>
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
                backgroundColor: C.primary,
                color: 'var(--ap-bg)',
                cursor: prefsLoading ? 'default' : 'pointer',
                opacity: prefsLoading ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!prefsLoading) e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { if (!prefsLoading) e.currentTarget.style.opacity = '1' }}
            >
              {prefsLoading ? 'Saving…' : 'Save preferences'}
            </button>
            {prefSaved && <span className="text-xs" style={{ color: '#4ade80' }}>✓ Saved</span>}
          </div>

        </div>
      </Card>

      {/* Notifications */}
      <Card title="Notifications" C={C}>
        <div className="space-y-4">
          {[
            { key: 'email',  label: 'Email summaries', sub: 'Daily digest of all AutoPilot activity' },
            { key: 'sms',    label: 'SMS alerts',       sub: 'Text when a 1–2 star review is posted' },
            { key: 'weekly', label: 'Weekly report',    sub: 'Performance report every Monday morning' },
            { key: 'alerts', label: 'System alerts',    sub: 'If AutoPilot pauses or needs attention' },
          ].map(({ key, label, sub }, i, arr) => (
            <div key={key}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: C.primary }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.secondary }}>{sub}</p>
                </div>
                <Toggle checked={notifs[key]} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} C={C} />
              </div>
              {i < arr.length - 1 && <div className="h-px mt-4" style={{ backgroundColor: C.divider }} />}
            </div>
          ))}
        </div>
      </Card>

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
              Your account will stop at the end of the billing period.
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Cancel your AutoPilot subscription at the end of the billing period?')) {
                window.alert('Your cancellation request has been received. Our team will email you a confirmation shortly.')
              }
            }}
            className="text-sm font-medium px-4 py-2 rounded transition-colors"
            style={{ color: 'rgb(239,68,68)', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)'}
          >
            Cancel subscription
          </button>
        </div>
      </div>
    </div>
  )
}
