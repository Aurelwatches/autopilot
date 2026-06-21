import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

/* ─── Shared easing + spring ────────────────────────────────────────────────── */
/* The brand easing — cubic-bezier(0.16, 1, 0.3, 1) — as a Framer array.          */
export const EASE = [0.16, 1, 0.3, 1]
export const SPRING = { type: 'spring', stiffness: 140, damping: 18, mass: 0.9 }
export const SOFT_SPRING = { type: 'spring', stiffness: 90, damping: 16, mass: 1 }

/* ─── Reveal: fade + slide-up when scrolled into view ───────────────────────── */

export function Reveal({
  children, delay = 0, y = 28, duration = 0.8,
  amount = 0.25, once = true, className, style,
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Stagger: container reveals children one-by-one on scroll ───────────────── */

export const staggerContainer = (stagger = 0.12, delayChildren = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
})

export const staggerItem = (y = 32) => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
})

export function Stagger({
  children, stagger = 0.12, delayChildren = 0.05,
  amount = 0.2, once = true, className, style,
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, y = 32, className, style }) {
  return (
    <motion.div className={className} style={style} variants={staggerItem(y)}>
      {children}
    </motion.div>
  )
}

/* ─── ShimmerButton: shimmer sweep + spring scale + click ripple ─────────────── */
/* Renders as <Link> (to), <a> (href), or <button>. Pass any extra props through. */

const MotionLink = motion.create(Link)

export function ShimmerButton({
  children, to, href, onClick, className = '', style,
  hoverScale = 1.04, ...rest
}) {
  const reduce = useReducedMotion()
  const [ripples, setRipples] = useState([])

  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const id = Date.now() + Math.random()
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top, size }])
    setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 650)
    onClick?.(e)
  }

  const common = {
    className: `shimmer-btn ${className}`.trim(),
    style: {
      position: 'relative',
      overflow: 'hidden',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    },
    onClick: handleClick,
    whileHover: reduce ? undefined : { scale: hoverScale },
    whileTap: reduce ? undefined : { scale: 0.96 },
    transition: SPRING,
    ...rest,
  }

  const inner = (
    <>
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="btn-ripple"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </>
  )

  if (to) return <MotionLink to={to} {...common}>{inner}</MotionLink>
  if (href) return <motion.a href={href} {...common}>{inner}</motion.a>
  return <motion.button type="button" {...common}>{inner}</motion.button>
}

/* ─── GlowCard: lift 8px + scale 1.02 + cyan glow + border light on hover ────── */

const GLOWS = {
  cyan: {
    shadow: '0 18px 50px rgba(8,145,178,0.30), 0 0 70px rgba(34,211,238,0.20), 0 0 0 1px rgba(56,189,248,0.55)',
    border: 'rgba(56,189,248,0.55)',
  },
  amber: {
    shadow: '0 18px 50px rgba(34,211,238,0.28), 0 0 70px rgba(34,211,238,0.18), 0 0 0 1px rgba(34,211,238,0.55)',
    border: 'rgba(34,211,238,0.55)',
  },
}

export function GlowCard({ children, glow = 'cyan', lift = 8, className, style, ...rest }) {
  const reduce = useReducedMotion()
  const g = GLOWS[glow] || GLOWS.cyan
  return (
    <motion.div
      className={className}
      style={style}
      whileHover={reduce ? undefined : {
        y: -lift,
        scale: 1.02,
        boxShadow: g.shadow,
        borderColor: g.border,
      }}
      transition={{ duration: 0.4, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/* ─── Typewriter hook ───────────────────────────────────────────────────────── */
/* Types `text` one char at a time. Honors reduced-motion (returns full text).    */

export function useTypewriter(text, { speed = 42, startDelay = 250 } = {}) {
  const reduce = useReducedMotion()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (reduce) { setCount(text.length); return }
    setCount(0)
    let i = 0
    let timer
    const start = setTimeout(function tick() {
      i += 1
      setCount(i)
      if (i < text.length) timer = setTimeout(tick, speed)
    }, startDelay)
    return () => { clearTimeout(start); clearTimeout(timer) }
  }, [text, speed, startDelay, reduce])

  return { typed: count, done: count >= text.length, reduce }
}

/* ─── FloatingOrbs: large blurred orbs that drift + rotate forever ───────────── */

export function FloatingOrbs({ orbs }) {
  const reduce = useReducedMotion()
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: o.size, height: o.size,
            borderRadius: '50%',
            background: o.background,
            opacity: o.opacity ?? 0.5,
            filter: `blur(${o.blur ?? 60}px)`,
            ...o.position,
          }}
          animate={reduce ? undefined : {
            x: o.x ?? [0, 60, -30, 0],
            y: o.y ?? [0, -40, 30, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.12, 0.96, 1],
          }}
          transition={{ duration: o.duration ?? 26, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ─── Particles: subtle drifting dot field ──────────────────────────────────── */

export function Particles({ count = 26, color = 'rgba(34,211,238,0.5)' }) {
  const reduce = useReducedMotion()
  const dots = useMemo(
    () => Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1.5 + Math.random() * 2.5,
      op: 0.15 + Math.random() * 0.45,
      dur: 7 + Math.random() * 9,
      delay: Math.random() * 8,
    })),
    [count],
  )
  if (reduce) return null
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {dots.map((d, i) => (
        <span
          key={i}
          className="ap-particle"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: color,
            '--p-op': d.op,
            animationDuration: `${d.dur}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
