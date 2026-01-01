'use client'

import { ReactNode } from 'react'
import { BrandingProvider } from './contexts/BrandingContext'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BrandingProvider>
      {children}
    </BrandingProvider>
  )
}
