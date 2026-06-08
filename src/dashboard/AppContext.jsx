import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

// Single C object — all values are CSS variable references.
// The actual colours live in index.css under :root (dark) and [data-theme="light"].
// This means the same C object works for both themes; toggling theme only updates
// the data-theme attribute on <html>, which CSS handles automatically.
export const C_VARS = {
  bg:              'var(--ap-bg)',
  card:            'var(--ap-card)',
  border:          'var(--ap-border)',
  divider:         'var(--ap-divider)',
  primary:         'var(--ap-text)',
  secondary:       'var(--ap-text2)',
  muted:           'var(--ap-text3)',
  accent:          'var(--ap-accent)',
  inputBg:         'var(--ap-input)',
  sentBubble:      'var(--ap-bubble)',
  cardShadow:      'var(--ap-shadow)',
  glassFilter:     'var(--ap-blur)',
  sidebarBg:       'var(--ap-sidebar)',
  sidebarBorder:   'var(--ap-sidebar-border)',
  sidebarActiveBg: 'var(--ap-sidebar-active)',
}

// Keep THEMES export so any code that still imports it doesn't break.
export const THEMES = { dark: C_VARS, light: C_VARS }

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user } = useAuth()

  // Restaurant name: prefer Supabase user metadata, fallback to localStorage
  const metaName = user?.user_metadata?.restaurant_name
  const [restaurantName, setNameState] = useState(
    () => metaName || localStorage.getItem('ap_restaurant') || 'Your Restaurant'
  )

  useEffect(() => {
    if (metaName && metaName !== restaurantName) {
      setNameState(metaName)
      localStorage.setItem('ap_restaurant', metaName)
    }
  }, [metaName])

  const [theme, setThemeState] = useState(
    () => localStorage.getItem('ap_theme') || 'dark'
  )

  // Sync data-theme on mount (covers page refreshes)
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.dataset.theme = 'light'
    } else {
      delete document.documentElement.dataset.theme
    }
  }, [])

  const C = C_VARS
  const userId = user?.id ?? null

  async function setRestaurantName(name) {
    const trimmed = name.trim() || 'Your Restaurant'
    setNameState(trimmed)
    localStorage.setItem('ap_restaurant', trimmed)

    if (supabase && user) {
      await supabase.auth.updateUser({ data: { restaurant_name: trimmed } })
      await supabase.from('profiles').upsert({ id: user.id, restaurant_name: trimmed })
    }
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'

    // 1. Add transition class so CSS variables animate smoothly for 300ms
    document.documentElement.classList.add('theme-transition')

    // 2. Flip the data-theme attribute (CSS vars resolve immediately)
    if (next === 'light') {
      document.documentElement.dataset.theme = 'light'
    } else {
      delete document.documentElement.dataset.theme
    }

    // 3. Log so you can verify in DevTools that the attribute is switching
    console.log('[AutoPilot] theme →', next, '| data-theme:', document.documentElement.getAttribute('data-theme'))

    // 4. Update React state + localStorage
    setThemeState(next)
    localStorage.setItem('ap_theme', next)

    // 5. Remove the transition class once the animation is done
    setTimeout(() => document.documentElement.classList.remove('theme-transition'), 350)
  }

  return (
    <AppContext.Provider value={{ restaurantName, setRestaurantName, theme, toggleTheme, C, userId }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
