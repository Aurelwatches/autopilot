import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDashboardReveal } from './revealContext'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const PAD = 8 // spotlight padding around the target element

const steps = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Welcome to AutoPilot',
    body: 'This is your command center. Everything — reviews, social posts, analytics and settings — lives in the sidebar on the left.',
  },
  {
    target: '[data-tour="reviews"]',
    title: 'Your reviews',
    body: 'Every new Google review lands here. AutoPilot drafts an on-brand AI reply for each one, so you can approve and post in a single click.',
  },
  {
    target: '[data-tour="posts"]',
    title: 'Social posting',
    body: 'Generate and schedule social posts in seconds. Use AI Assist to turn a quick idea into a polished, ready-to-publish post.',
  },
  {
    target: null,
    title: "You're all set",
    body: 'That’s the whole tour. Your dashboard is ready — let’s get your restaurant on AutoPilot.',
    final: true,
  },
]

function CheckCircle() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="30" stroke="#22C55E" strokeWidth="2.5" opacity="0.4" />
      <circle cx="32" cy="32" r="22" fill="rgba(34,197,94,0.12)" />
      <path d="M22 33l7 7 14-15" stroke="#22C55E" strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Onboarding() {
  const revealed = useDashboardReveal()
  const cardRef = useRef(null)

  const [active, setActive] = useState(() => !localStorage.getItem('ap_onboarded'))
  const [step, setStep]     = useState(0)
  const [rect, setRect]     = useState(null)
  const [cardH, setCardH]   = useState(240)
  const [visible, setVisible] = useState(false)

  const current = steps[step]

  // Fade in once the dashboard has finished its reveal animation
  useEffect(() => {
    if (active && revealed) {
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    }
  }, [active, revealed])

  // Measure the spotlight target for the current step
  useLayoutEffect(() => {
    if (!active) return
    function measure() {
      if (current.target) {
        const el = document.querySelector(current.target)
        setRect(el ? el.getBoundingClientRect() : null)
      } else {
        setRect(null)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [active, step, current.target])

  // Measure card height so we can keep it inside the viewport
  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight)
  }, [step, visible])

  if (!active || !revealed) return null

  function finish() {
    localStorage.setItem('ap_onboarded', '1')
    setVisible(false)
    setTimeout(() => setActive(false), 250)
  }

  function next() {
    if (step >= steps.length - 1) finish()
    else setStep(s => s + 1)
  }

  // ----- Spotlight geometry -----
  const spot = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null

  // ----- Card placement -----
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const CARD_W = 360
  let cardStyle

  if (current.final || !spot) {
    // Centered for the final step
    cardStyle = {
      left: '50%',
      top: '50%',
      transform: visible
        ? 'translate(-50%, -50%) scale(1)'
        : 'translate(-50%, -48%) scale(0.97)',
    }
  } else {
    // Place to the right of the spotlit element, vertically clamped
    const left = Math.min(spot.left + spot.width + 24, vw - CARD_W - 24)
    let top
    if (spot.height > vh * 0.55) {
      top = (vh - cardH) / 2 // tall target (sidebar) → center vertically
    } else {
      top = spot.top + spot.height / 2 - cardH / 2
    }
    top = Math.max(24, Math.min(top, vh - cardH - 24))
    cardStyle = {
      left,
      top,
      transform: visible ? 'translateX(0)' : 'translateX(-10px)',
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        opacity: visible ? 1 : 0,
        transition: `opacity 250ms ${EASE}`,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* Spotlight cutout: a huge box-shadow dims everything except the target */}
      {spot && !current.final ? (
        <div
          style={{
            position: 'fixed',
            top: spot.top, left: spot.left,
            width: spot.width, height: spot.height,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(8,8,12,0.74)',
            border: '1px solid rgba(255,255,255,0.22)',
            transition: `all 320ms ${EASE}`,
            pointerEvents: 'none',
          }}
        />
      ) : (
        // Final step: full dark glass veil
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(8,8,12,0.78)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* Tooltip / step card */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          width: CARD_W, maxWidth: 'calc(100vw - 48px)',
          background: 'rgba(20,20,26,0.92)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 18,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          padding: current.final ? '36px 32px 32px' : '26px 26px 22px',
          color: '#F0EEE9',
          textAlign: current.final ? 'center' : 'left',
          transition: `opacity 320ms ${EASE}, transform 320ms ${EASE}`,
          ...cardStyle,
        }}
      >
        {/* Arrow pointing toward the spotlit element (left edge) */}
        {!current.final && spot && (
          <div
            style={{
              position: 'absolute', left: -7, top: 32,
              width: 14, height: 14,
              background: 'rgba(20,20,26,0.92)',
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
              transform: 'rotate(45deg)',
            }}
          />
        )}

        {current.final && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <CheckCircle />
          </div>
        )}

        {!current.final && (
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#4A8EFF', marginBottom: 8,
          }}>
            Step {step + 1} of {steps.length - 1}
          </p>
        )}

        <h2 style={{
          fontSize: current.final ? 24 : 19, fontWeight: 700,
          letterSpacing: '-0.02em', color: '#FFFFFF', marginBottom: 8,
        }}>
          {current.title}
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#A8A6A1', marginBottom: 24 }}>
          {current.body}
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 7 }}>
            {steps.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === step ? 20 : 7, height: 7, borderRadius: 980,
                  background: i === step ? '#4A8EFF' : 'rgba(255,255,255,0.18)',
                  transition: `all 250ms ${EASE}`,
                }}
              />
            ))}
          </div>

          {current.final ? (
            <button
              onClick={finish}
              style={{
                background: '#FFFFFF', color: '#000000',
                border: 'none', borderRadius: 980,
                padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Start your free trial
            </button>
          ) : (
            <button
              onClick={next}
              style={{
                background: '#4A8EFF', color: '#FFFFFF',
                border: 'none', borderRadius: 980,
                padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Next
            </button>
          )}
        </div>

        {/* Skip — on every step */}
        {!current.final && (
          <button
            onClick={finish}
            style={{
              position: 'absolute', top: 18, right: 18,
              background: 'transparent', border: 'none',
              color: '#777', fontSize: 12, cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F0EEE9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#777')}
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  )
}
