import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export const THEMES = {
  dark: {
    bg: '#000000',
    card: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    divider: 'rgba(255,255,255,0.05)',
    primary: '#F0EEE9', secondary: '#888780', muted: '#555550',
    accent: '#4A8EFF',
    inputBg: 'rgba(255,255,255,0.04)',
    sentBubble: 'rgba(255,255,255,0.06)',
    cardShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
    glassFilter: 'blur(20px)',
    sidebarBg: 'rgba(255,255,255,0.02)',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    sidebarActiveBg: 'rgba(255,255,255,0.06)',
  },
  light: {
    bg: '#F5F4F0', card: '#FFFFFF', border: '#E5E4E0', divider: '#EEEDE9',
    primary: '#0A0A0A', secondary: '#5A5955', muted: '#9A9994',
    accent: '#4A8EFF',
    inputBg: '#F8F7F4', sentBubble: '#E8E6E1',
    cardShadow: '0 1px 4px rgba(0,0,0,0.06)',
    glassFilter: 'none',
    sidebarBg: '#F5F4F0',
    sidebarBorder: '#EEEDE9',
    sidebarActiveBg: '#EEEDE9',
  },
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user } = useAuth()

  // Restaurant name: prefer Supabase user metadata, fallback to localStorage
  const metaName = user?.user_metadata?.restaurant_name
  const [restaurantName, setNameState] = useState(
    () => metaName || localStorage.getItem('ap_restaurant') || 'Your Restaurant'
  )

  // Keep in sync if the user object updates (e.g. after metadata change)
  useEffect(() => {
    if (metaName && metaName !== restaurantName) {
      setNameState(metaName)
      localStorage.setItem('ap_restaurant', metaName)
    }
  }, [metaName])

  const [theme, setThemeState] = useState(
    () => localStorage.getItem('ap_theme') || 'dark'
  )

  const C = THEMES[theme] ?? THEMES.dark
  const userId = user?.id ?? null

  async function setRestaurantName(name) {
    const trimmed = name.trim() || 'Your Restaurant'
    setNameState(trimmed)
    localStorage.setItem('ap_restaurant', trimmed)

    // Persist to Supabase user metadata and profiles table
    if (supabase && user) {
      await supabase.auth.updateUser({ data: { restaurant_name: trimmed } })
      await supabase.from('profiles').upsert({ id: user.id, restaurant_name: trimmed })
    }
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    localStorage.setItem('ap_theme', next)
  }

  return (
    <AppContext.Provider value={{ restaurantName, setRestaurantName, theme, toggleTheme, C, userId }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
