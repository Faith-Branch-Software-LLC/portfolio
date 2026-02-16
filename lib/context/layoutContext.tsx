"use client"

import { createContext, useCallback, useContext, useState } from 'react'

type LayoutContextType = {
  totalTranslation: number
  setTotalTranslation: (value: number) => void
  maxLayer: number
  setMaxLayer: (value: number) => void
  resetLayout: () => void
}

const LayoutContext = createContext<LayoutContextType>({
  totalTranslation: 0,
  setTotalTranslation: () => {},
  maxLayer: 0,
  setMaxLayer: () => {},
  resetLayout: () => {}
})

/**
 * Provider component for layout-related state
 */
export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [totalTranslation, setTotalTranslation] = useState(0)
  const [maxLayer, setMaxLayer] = useState(0)

  const resetLayout = useCallback(() => {
    setMaxLayer(0)
    setTotalTranslation(0)
  }, [])

  return (
    <LayoutContext.Provider value={{
      totalTranslation,
      setTotalTranslation,
      maxLayer,
      setMaxLayer,
      resetLayout
    }}>
      {children}
    </LayoutContext.Provider>
  )
}

/**
 * Hook to access layout context values
 */
export function useLayout() {
  return useContext(LayoutContext)
} 