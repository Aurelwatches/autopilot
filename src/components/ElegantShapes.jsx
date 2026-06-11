import { motion, useReducedMotion } from 'framer-motion'

/* ─── Elegant floating shapes ────────────────────────────────────────────────── */
/* Adapted from 21st.dev "Shape Landing Hero" (kokonutui). Rotated translucent      */
/* gradient pills drift on entrance + bob forever, giving clean layered 3D depth.   */

function ElegantShape({ delay = 0, width = 400, height = 100, rotate = 0, color, position }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      style={{ position: 'absolute', ...position }}
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width, height, position: 'relative' }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          background: `linear-gradient(to right, ${color}, transparent)`,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          border: '2px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px 0 rgba(255,255,255,0.05)',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 9999,
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16), transparent 70%)',
          }} />
        </div>
      </motion.div>
    </motion.div>
  )
}

const SHAPES = [
  { delay: 0.30, width: 620, height: 150, rotate:  12, color: 'rgba(56,189,248,0.16)',  position: { left: '-6%',  top: '16%' } },
  { delay: 0.50, width: 520, height: 130, rotate: -15, color: 'rgba(59,130,246,0.16)',  position: { right: '-4%', top: '70%' } },
  { delay: 0.42, width: 320, height: 90,  rotate:  -8, color: 'rgba(34,211,238,0.16)',  position: { left: '7%',   bottom: '7%' } },
  { delay: 0.60, width: 220, height: 64,  rotate:  20, color: 'rgba(255,255,255,0.10)', position: { right: '16%', top: '11%' } },
  { delay: 0.70, width: 160, height: 44,  rotate: -25, color: 'rgba(103,232,249,0.16)', position: { left: '21%',  top: '7%' } },
]

export default function ElegantShapes() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {SHAPES.map((s, i) => (
        <ElegantShape key={i} {...s} />
      ))}
    </div>
  )
}
