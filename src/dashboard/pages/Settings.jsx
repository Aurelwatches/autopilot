import { useState } from 'react'

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL ?? '/api/webhook'

const C = {
  card: '#141414', border: '#2A2A2A', divider: '#1E1E1E',
  primary: '#F0EEE9', secondary: '#888780', muted: '#3A3835', accent: '#4A90D9',
}

function CopyButton({ value }) {
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
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        backgroundColor: checked ? C.accent : '#2A2A2A', position: 'relative',
        transition: 'background-color 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        backgroundColor: checked ? '#fff' : '#888780',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

function Card({ title, children }) {
  return (
    <div className="rounded-lg overflow-hidden mb-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
      <div className="px-6 py-4" style={{ borderBottom: `1px solid ${C.divider}` }}>
        <h2 className="text-sm font-semibold" style={{ color: C.primary }}>{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({ label, defaultValue, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full text-sm px-4 py-2.5 rounded outline-none"
        style={{ backgroundColor: '#0F0F0F', color: C.primary, border: `1px solid ${C.border}` }}
        onFocus={e => e.target.style.borderColor = C.secondary}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  )
}

export default function Settings() {
  const [saved, setSaved] = useState(false)
  const [socials, setSocials] = useState({ instagram: true, facebook: true })
  const [notifs, setNotifs]   = useState({ email: true, sms: false, weekly: true, alerts: true })

  function handleSave(e) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="px-8 py-8" style={{ maxWidth: 660 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: C.primary }}>Settings</h1>
        <p className="text-sm" style={{ color: C.secondary }}>Manage your restaurant account</p>
      </div>

      {/* Restaurant info */}
      <Card title="Restaurant">
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Restaurant name"  defaultValue="Mario's Trattoria" />
          <Field label="Address"          defaultValue="142 North St, San Francisco, CA 94103" />
          <Field label="Phone"            defaultValue="(415) 555-0182" type="tel" />
          <Field label="Website"          defaultValue="mariostrattoria.com" />

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="text-sm font-semibold px-5 py-2 rounded transition-colors"
              style={{ backgroundColor: C.primary, color: '#0A0A0A' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e4e2dd'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = C.primary}
            >
              Save changes
            </button>
            {saved && <span className="text-xs" style={{ color: '#4ade80' }}>✓ Saved</span>}
          </div>
        </form>
      </Card>

      {/* Connected accounts */}
      <Card title="Connected accounts">
        <div className="space-y-4">
          {/* Google */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>Google Business Profile</p>
              <p className="text-xs mt-0.5" style={{ color: C.secondary }}>mario's-trattoria · 247 reviews synced</p>
            </div>
            <span
              className="text-xs px-2.5 py-1 rounded"
              style={{ backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}
            >
              ✓ Connected
            </span>
          </div>

          <div className="h-px" style={{ backgroundColor: C.divider }} />

          {/* Make.com webhook */}
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: C.primary }}>Make.com Webhook</p>
            <p className="text-xs mb-2" style={{ color: C.secondary }}>Paste this URL as the webhook target in your Make.com scenario</p>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded text-xs font-mono"
              style={{ backgroundColor: '#0F0F0F', border: `1px solid ${C.border}`, color: C.secondary }}
            >
              <span className="flex-1 truncate">{WEBHOOK_URL}</span>
              <CopyButton value={WEBHOOK_URL} />
            </div>
          </div>

          <div className="h-px" style={{ backgroundColor: C.divider }} />

          {/* Instagram */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>Instagram</p>
              <p className="text-xs mt-0.5" style={{ color: C.secondary }}>@mariostrattoriasf · 2,840 followers</p>
            </div>
            <Toggle checked={socials.instagram} onChange={v => setSocials(s => ({ ...s, instagram: v }))} />
          </div>

          <div className="h-px" style={{ backgroundColor: C.divider }} />

          {/* Facebook */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: C.primary }}>Facebook</p>
              <p className="text-xs mt-0.5" style={{ color: C.secondary }}>Mario's Trattoria SF · 1,204 followers</p>
            </div>
            <Toggle checked={socials.facebook} onChange={v => setSocials(s => ({ ...s, facebook: v }))} />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card title="Notifications">
        <div className="space-y-4">
          {[
            { key: 'email',   label: 'Email summaries',        sub: 'Daily digest of all AutoPilot activity' },
            { key: 'sms',     label: 'SMS alerts',             sub: 'Text when a 1–2 star review is posted' },
            { key: 'weekly',  label: 'Weekly report',          sub: 'Performance report every Monday morning' },
            { key: 'alerts',  label: 'System alerts',          sub: 'If AutoPilot pauses or needs attention' },
          ].map(({ key, label, sub }, i, arr) => (
            <div key={key}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: C.primary }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.secondary }}>{sub}</p>
                </div>
                <Toggle checked={notifs[key]} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} />
              </div>
              {i < arr.length - 1 && <div className="h-px mt-4" style={{ backgroundColor: C.divider }} />}
            </div>
          ))}
        </div>
      </Card>

      {/* Danger zone */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: C.card, border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <div className="px-6 py-4" style={{ borderBottom: `1px solid rgba(239,68,68,0.1)` }}>
          <h2 className="text-sm font-semibold" style={{ color: 'rgb(239,68,68)' }}>Danger zone</h2>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: C.primary }}>Cancel subscription</p>
            <p className="text-xs mt-0.5" style={{ color: C.secondary }}>Your account will stop at the end of the billing period.</p>
          </div>
          <button
            className="text-sm font-medium px-4 py-2 rounded transition-colors"
            style={{ color: 'rgb(239,68,68)', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)' }}
            onClick={e => e.preventDefault()}
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
