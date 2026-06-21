// Eye / eye-off toggle button for password fields.
// Absolutely positioned — the parent must be position:relative and the input
// needs right padding so the text never slides under the icon.

function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M6.61 6.61A13.5 13.5 0 0 0 1 12s4 8 11 8a9.7 9.7 0 0 0 5.39-1.61" />
      <path d="M1 1l22 22" />
    </svg>
  )
}

export default function EyeToggle({ visible, onClick, color }) {
  const iconStyle = (show) => ({
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: show ? 1 : 0,
    transform: show ? 'scale(1) rotate(0deg)' : 'scale(0.6) rotate(-15deg)',
    transition: 'opacity 180ms ease, transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
  })

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={visible ? 'Hide password' : 'Show password'}
      title={visible ? 'Hide password' : 'Show password'}
      style={{
        position: 'absolute', right: 8, top: '50%',
        transform: 'translateY(-50%)',
        width: 32, height: 32, padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color, opacity: 0.65, transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '0.65')}
    >
      {/* Both icons stacked for a smooth cross-fade swap */}
      <span style={{ position: 'relative', width: 18, height: 18, display: 'block' }}>
        <span style={iconStyle(visible)}><EyeOpen /></span>
        <span style={iconStyle(!visible)}><EyeOff /></span>
      </span>
    </button>
  )
}
