'use client'

import { ReactNode } from 'react'
import { WalletProvider } from '@/components/WalletProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  )
}
