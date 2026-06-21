import { useEffect, useState } from 'react'
import { useDashboardReveal } from './revealContext'
import { supabase } from '../lib/supabase'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const steps = [
  {
    icon: null,
    title: 'Welcome to AutoPilot',
    body: 'Your restaurant now has a 24/7 AI assistant. Reviews, social posts, and customer follow-ups — all handled automatically while you focus on running the place.',
  },
  {
    icon: null,
    title: 'Automatic review replies',
    body: 'Every new Google review gets an AI-crafted reply in your voice. Approve and post in one click — or let AutoPilot handle it fully on your schedule.',
  },
  {
    icon: null,
    title: 'Social posts on autopilot',
    body: 'Generate and schedule social content in seconds. Drop an idea, hit AI Assist, and get a polished post ready to publish.',
  },
  {
    icon: null,
    title: 'Analytics & insights',
    body: 'Track your review score trends, reply speed, and customer sentiment over time. Know exactly how your reputation is moving.',
  },
  {
    icon: null,
    title: "You're all set",
    body: "Your dashboard is live and your restaurant is on AutoPilot. Connect Google Business Profile in Settings to start receiving automated replies.",
    final: true,
  },
]

function CheckCircle() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <circle cx="28" cy="28" r="26" stroke="#22D3EE" strokeWidth="2" opacity="0.35" />
      <circle cx="28" cy="28" r="19" fill="rgba(34,211,238,0.10)" />
      <path d="M19 29l6 6 13-13" stroke="#22D3EE" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Onboarding() {
  const revealed = useDashboardReveal()

  const [active,  setActive]  = useState(false)
  const [step,    setStep]    = useState(0)
  const [visible, setVisible] = useState(false)

  const current = steps[step]
  const total   = steps.length - 1  // exclude final step from count

  // Check localStorage first, then Supabase
  useEffect(() => {
    if (localStorage.getItem('ap_onboarded')) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const { data } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', session.user.id)
        .single()
      if (data?.onboarded) {
        localStorage.setItem('ap_onboarded', '1')
      } else {
        localStorage.setItem('ap_onboarded', '1')
        supabase.from('profiles').update({ onboarded: true }).eq('id', session.user.id)
        setActive(true)
      }
    })
  }, [])

  // Fade in after dashboard reveal
  useEffect(() => {
    if (active && revealed) {
      const id = setTimeout(() => setVisible(true), 100)
      return () => clearTimeout(id)
    }
  }, [active, revealed])

  if (!active || !revealed) return null

  function finish() {
    setVisible(false)
    setTimeout(() => setActive(false), 280)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').update({ onboarded: true }).eq('id', session.user.id)
      }
    })
  }

  function next() {
    if (step >= steps.length - 1) finish()
    else setStep(s => s + 1)
  }

  function prev() {
    if (step > 0) setStep(s => s - 1)
  }

  const isFinal = current.final

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        background: 'rgba(8,8,12,0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        opacity: visible ? 1 : 0,
        transition: `opacity 280ms ${EASE}`,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* Modal card */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(18,18,24,0.96)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
          overflow: 'hidden',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
          transition: `transform 320ms ${EASE}`,
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / steps.length) * 100}%`,
            background: 'linear-gradient(90deg, #22D3EE, #0ea5e9)',
            borderRadius: 999,
            transition: `width 320ms ${EASE}`,
          }} />
        </div>

        {/* Body */}
        <div style={{ padding: '36px 36px 32px', textAlign: isFinal ? 'center' : 'left' }}>

          {/* Icon / check */}
          {isFinal && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <CheckCircle />
            </div>
          )}

          {/* Step counter */}
          {!isFinal && (
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#22D3EE',
              marginBottom: 8, fontFamily: 'var(--font-mono)',
            }}>
              Step {step + 1} of {total}
            </p>
          )}

          {/* Title */}
          <h2 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: isFinal ? 26 : 21,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            marginBottom: 10,
            lineHeight: 1.2,
          }}>
            {current.title}
          </h2>

          {/* Body text */}
          <p style={{
            fontSize: 14.5, lineHeight: 1.65,
            color: 'rgba(240,238,233,0.65)',
            marginBottom: 32,
          }}>
            {current.body}
          </p>

          {/* Progress dots */}
          {!isFinal && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {steps.map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: i === step ? 22 : 7, height: 7, borderRadius: 999,
                    background: i === step ? '#22D3EE' : 'rgba(255,255,255,0.15)',
                    transition: `all 280ms ${EASE}`,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* Buttons */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 10,
            justifyContent: isFinal ? 'center' : 'space-between',
          }}>
            {isFinal ? (
              <button
                onClick={finish}
                style={{
                  background: '#22D3EE', color: '#04141A',
                  border: 'none', borderRadius: 999,
                  padding: '13px 32px', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(34,211,238,0.35)',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Let's go →
              </button>
            ) : (
              <>
                {/* Back + Skip on the left */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {step > 0 && (
                    <button
                      onClick={prev}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 999, padding: '9px 18px',
                        fontSize: 13.5, fontWeight: 500, color: 'rgba(240,238,233,0.6)',
                        cursor: 'pointer', transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      ← Back
                    </button>
                  )}
                  <button
                    onClick={finish}
                    style={{
                      background: 'transparent', border: 'none',
                      fontSize: 13, color: 'rgba(255,255,255,0.35)',
                      cursor: 'pointer', padding: '9px 4px',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                  >
                    Skip tour
                  </button>
                </div>

                {/* Next on the right */}
                <button
                  onClick={next}
                  style={{
                    background: '#22D3EE', color: '#04141A',
                    border: 'none', borderRadius: 999,
                    padding: '11px 24px', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', transition: 'opacity 0.15s',
                    boxShadow: '0 4px 16px rgba(34,211,238,0.25)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {step === total - 1 ? 'Finish' : 'Next →'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
