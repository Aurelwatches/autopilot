import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export const THEMES = {
  dark: {
    bg: '#0A0A0A', card: '#141414', border: '#2A2A2A', divider: '#1E1E1E',
    primary: '#F0EEE9', secondary: '#888780', muted: '#3A3835',
    accent: '#4A90D9', inputBg: '#0F0F0F', sentBubble: '#1D1D1D',
  },
  light: {
    bg: '#F5F4F0', card: '#FFFFFF', border: '#E5E4E0', divider: '#EEEDE9',
    primary: '#0A0A0A', secondary: '#5A5955', muted: '#9A9994',
    accent: '#4A90D9', inputBg: '#F8F7F4', sentBubble: '#E8E6E1',
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
