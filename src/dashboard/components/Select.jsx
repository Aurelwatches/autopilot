import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

const DROPDOWN_MAX_H = 220

// Reads a CSS variable from the document root as a resolved value
function resolveVar(v) {
  if (typeof v === 'string' && v.startsWith('var(')) {
    const name = v.match(/var\(([^)]+)\)/)?.[1]
    if (name) return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  }
  return v
}

function DropdownPortal({ triggerRef, children, dropUp }) {
  const [style, setStyle] = useState({})

  useEffect(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
      ...(dropUp
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    })
  }, [triggerRef, dropUp])

  return createPortal(
    <div style={style}>{children}</div>,
    document.body
  )
}

export default function Select({ label, value, onChange, options, C, placeholder = 'Select…', small = false }) {
  const [open, setOpen] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollHeight, setScrollHeight] = useState(0)
  const [clientHeight, setClientHeight] = useState(0)
  const [dropUp, setDropUp] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)

  const selected = options.find(o => String(o.value) === String(value))

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Decide drop direction
  useEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setDropUp(window.innerHeight - rect.bottom < DROPDOWN_MAX_H + 16)
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
        const el = listRef.current
        if (!el) return
        const idx = options.findIndex(o => String(o.value) === String(value))
        if (idx >= 0) el.children[idx]?.scrollIntoView({ block: 'nearest' })
      })
    }
  }, [open])

  function handleSelect(val) {
    onChange(val)
    setOpen(false)
  }

  const showTopFade    = scrollTop > 8
  const showBottomFade = scrollHeight - scrollTop - clientHeight > 8

  const py = small ? '6px' : '10px'
  const px = small ? '10px' : '14px'
  const fs = small ? 13 : 14

  // Solid background colors that are visible regardless of theme
  const panelBg     = resolveVar('var(--ap-card-solid)')  || '#0E1420'
  const panelBorder = resolveVar('var(--ap-border-solid)') || '#2E2A24'
  const accent      = resolveVar(C.accent) || '#22D3EE'

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: C.secondary }}>
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        ref={triggerRef}
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
          fill="none" stroke={open ? accent : C.secondary}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>

      {/* Portalled dropdown panel — never clipped by parent overflow */}
      <AnimatePresence>
        {open && (
          <DropdownPortal triggerRef={triggerRef} dropUp={dropUp}>
            <motion.div
              initial={{ opacity: 0, y: dropUp ? 6 : -6, scaleY: 0.94 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: dropUp ? 6 : -6, scaleY: 0.94 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              style={{
                backgroundColor: panelBg,
                border: `1px solid ${panelBorder}`,
                borderRadius: 10,
                boxShadow: '0 12px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                transformOrigin: dropUp ? 'bottom center' : 'top center',
                position: 'relative',
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
                      background: `linear-gradient(to bottom, ${panelBg}, transparent)`,
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
                  const isSelected = String(opt.value) === String(value)
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
                        backgroundColor: isSelected ? `${accent}20` : 'transparent',
                        color: isSelected ? accent : C.primary,
                        fontSize: fs,
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.1s ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'
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
                      background: `linear-gradient(to top, ${panelBg}, transparent)`,
                      pointerEvents: 'none', zIndex: 1,
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </DropdownPortal>
        )}
      </AnimatePresence>
    </div>
  )
}
