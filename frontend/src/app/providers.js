'use client'

import { Toaster } from "sonner"

export function Providers({ children }) {
  return (
    <>
      <Toaster />
      {children}
    </>
  )
} 