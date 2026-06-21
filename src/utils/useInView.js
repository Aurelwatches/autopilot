import { useEffect, useRef, useState } from 'react'

/**
 * Fires once when the element crosses `threshold` of the viewport.
 * Returns [ref, inView]. Never reverses (one-way reveal).
 */
export function useInView({ threshold = 0.2, rootMargin = '0px' } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return

    // No IntersectionObserver (or reduced environments) → show immediately.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, inView])

  return [ref, inView]
}
