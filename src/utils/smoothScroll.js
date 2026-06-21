function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function highlightSection(el) {
  const heading = el.querySelector('h1, h2, h3')
  if (!heading) return
  heading.classList.add('section-highlight')
  // Remove after animation completes so it can re-trigger on repeat clicks
  setTimeout(() => heading.classList.remove('section-highlight'), 650)
}

let rafId = null

export function smoothScrollTo(targetId) {
  const target = document.getElementById(targetId)
  if (!target) return

  // Cancel any in-progress scroll animation
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }

  const start = window.scrollY
  const targetTop = target.getBoundingClientRect().top + window.scrollY - 80
  const distance = targetTop - start
  const duration = 800
  let startTime = null

  function step(timestamp) {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)

    window.scrollTo(0, start + distance * easeInOutCubic(progress))

    if (progress < 1) {
      rafId = requestAnimationFrame(step)
    } else {
      rafId = null
      highlightSection(target)
    }
  }

  rafId = requestAnimationFrame(step)
}
