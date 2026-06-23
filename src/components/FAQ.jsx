import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE, Reveal } from './motion'

const C = {
  primary:   '#0A0A0A',
  secondary: '#6B7280',
  accent:    '#22D3EE',
}

const faqs = [
  {
    q: 'How does AutoPilot reply to my reviews?',
    a: 'AutoPilot watches your Google Business Profile around the clock. When a new review lands, our AI writes a thoughtful, on-brand reply in your voice and sends it during your set business hours — so replies go out at natural times, not 3 am.',
  },
  {
    q: 'Will the replies sound like a robot?',
    a: 'No. The AI is trained on real restaurant conversations and learns your tone, so replies read like a warm note from the owner — not a canned template.',
  },
  {
    q: 'How long does setup take?',
    a: 'Most restaurants are live in under 5 minutes. You create an account, connect your Google profile, and we handle the rest.',
  },
  {
    q: 'Can I see the replies before they go out?',
    a: 'Yes. You can run in review-first mode, where every reply waits for your approval, or let AutoPilot post automatically once you trust the voice.',
  },
  {
    q: 'What if I want to cancel?',
    a: 'Cancel anytime, no contracts and no cancellation fees. Your account stays active through the end of your billing period.',
  },
  {
    q: 'Do I need technical knowledge?',
    a: 'Not at all. If you can log into Google, you can run AutoPilot. There is nothing to install and nothing to maintain.',
  },
  {
    q: 'Is my Google account safe?',
    a: 'Yes. We connect through Google’s official, secure authorization — AutoPilot only gets the access it needs to manage reviews and posts, and you can revoke it at any time.',
  },
  {
    q: 'How much does it cost?',
    a: 'AutoPilot starts at $99/mo for automated Google review replies. All plans include a 14-day free trial — cancel anytime.',
  },
]

function FaqItem({ item, open, onToggle }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: `1px solid ${open ? 'rgba(34,211,238,0.45)' : 'rgba(0,0,0,0.07)'}`,
      borderRadius: 16,
      boxShadow: open ? '0 0 24px rgba(34,211,238,0.10)' : '0 2px 12px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      transition: 'border-color 250ms ease, box-shadow 250ms ease',
    }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, padding: '20px 22px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: C.primary }}>
          {item.q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{ flexShrink: 0, color: C.accent, lineHeight: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ padding: '0 22px 22px', fontSize: 15, lineHeight: 1.65, color: C.secondary, margin: 0 }}>
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" style={{ position: 'relative', padding: '96px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Reveal amount={0.4} style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{
            fontSize: 13, fontWeight: 500,
            color: C.accent, marginBottom: 16,
          }}>
            Common questions
          </p>
          <h2 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 'clamp(32px, 5vw, 50px)', fontWeight: 800,
            letterSpacing: '-0.03em', color: C.primary, margin: 0,
          }}>
            Questions, answered.
          </h2>
        </Reveal>

        <Reveal amount={0.1} y={30} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((item, i) => (
            <FaqItem
              key={item.q}
              item={item}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </Reveal>
      </div>
    </section>
  )
}
