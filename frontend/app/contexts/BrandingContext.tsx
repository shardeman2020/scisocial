'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

import { API_BASE_URL } from '../config/api'
interface BrandingData {
  logoUrl: string | null
  accentColor: string
  tagline: string
  welcomeMessage: string
}

interface BrandingContextType {
  branding: BrandingData
  isLoading: boolean
  fetchBranding: (institutionId: string) => Promise<void>
}

const defaultBranding: BrandingData = {
  logoUrl: null,
  accentColor: '#9333ea', // Default purple
  tagline: 'Citation-Backed Scientific Discourse',
  welcomeMessage: 'Welcome to SciSocial',
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingData>(defaultBranding)
  const [isLoading, setIsLoading] = useState(false)

  const fetchBranding = async (institutionId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/institution-admin/${institutionId}/branding`)

      if (response.ok) {
        const data = await response.json()
        setBranding({
          logoUrl: data.logoUrl || null,
          accentColor: data.accentColor || defaultBranding.accentColor,
          tagline: data.tagline || defaultBranding.tagline,
          welcomeMessage: data.welcomeMessage || defaultBranding.welcomeMessage,
        })
      } else {
        // Use defaults if branding not found
        setBranding(defaultBranding)
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error)
      setBranding(defaultBranding)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <BrandingContext.Provider value={{ branding, isLoading, fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}

// Utility hook to apply accent color as CSS variable
export function useAccentColor() {
  const { branding } = useBranding()

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', branding.accentColor)
  }, [branding.accentColor])

  return branding.accentColor
}
