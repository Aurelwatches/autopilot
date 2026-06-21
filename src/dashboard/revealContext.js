import { createContext, useContext } from 'react'

// Provided by DashboardLayout — true once the entry skeleton is done.
const RevealCtx = createContext(true)
export const useDashboardReveal = () => useContext(RevealCtx)
export default RevealCtx
