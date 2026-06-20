import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const DROPDOWN_MAX_H = 220

export default function Select({ label, value, onChange, options, C, placeholder = 'Select…', small = false }) {
  const [open, setOpen] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollHeight, setScrollHeight] = useState(0)
  const [clientHeight, setClientHeight] = useState(0)
  const containerRef = useRef(null)
  const listRef = useRef(null)
  const [dropUp, setDropUp] = useState(false)

  const selected = options.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Decide if dropdown should open upward
  useEffect(() => {
    if (!open || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    setDropUp(spaceBelow < DROPDOWN_MAX_H + 16)
  }, [open])

  // Scroll metrics for fade indicators
  const updateScroll = useCallback(() => {
    const el = listRef.current
    if (!el) return
    setScrollTop(el.scrollTop)
    setScrollHeight(el.scrollHeight)
    setClientHeight(el.clientHeight)
  }, [])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        updateScroll()
        // Scroll selected option into view
        const el = listRef.current
        if (!el) return
        const idx = options.findIndex(o => o.value === value)
        if (idx >= 0) {
          const item = el.children[idx]
          if (item) item.scrollIntoView({ block: 'nearest' })
        }
      })
    }
  }, [open])

  function handleSelect(val) {
    onChange(val)
    setOpen(false)
  }

  const showTopFade = scrollTop > 8
  const showBottomFade = scrollHeight - scrollTop - clientHeight > 8

  const py = small ? '6px' : '10px'
  const px = small ? '10px' : '14px'
  const fs = small ? 13 : 14

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          backgroundColor: C.inputBg,
          color: selected ? C.primary : C.muted,
          border: `1px solid ${open ? C.accent : C.border}`,
          borderRadius: 8,
          padding: `${py} ${px}`,
          fontSize: fs,
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
          {selected?.label ?? placeholder}
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ flexShrink: 0, transformOrigin: 'center' }}
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke={open ? C.accent : C.secondary}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: dropUp ? 6 : -6, scaleY: 0.94 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: dropUp ? 6 : -6, scaleY: 0.94 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute',
              zIndex: 9999,
              left: 0,
              right: 0,
              ...(dropUp ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18)',
              overflow: 'hidden',
              transformOrigin: dropUp ? 'bottom center' : 'top center',
            }}
          >
            {/* Top fade */}
            <AnimatePresence>
              {showTopFade && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 28,
                    background: `linear-gradient(to bottom, ${C.card}, transparent)`,
                    pointerEvents: 'none', zIndex: 1,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Options list */}
            <div
              ref={listRef}
              onScroll={updateScroll}
              style={{
                maxHeight: DROPDOWN_MAX_H,
                overflowY: 'auto',
                padding: '6px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {options.map((opt, i) => {
                const isSelected = opt.value === value
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.12, delay: i * 0.018 }}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 7,
                      border: 'none',
                      backgroundColor: isSelected ? `${C.accent}18` : 'transparent',
                      color: isSelected ? C.accent : C.primary,
                      fontSize: fs,
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = C.inputBg
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Bottom fade */}
            <AnimatePresence>
              {showBottomFade && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
                    background: `linear-gradient(to top, ${C.card}, transparent)`,
                    pointerEvents: 'none', zIndex: 1,
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
