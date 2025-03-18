import * as React from "react"
import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster 
      position="top-right"
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
      }}
    />
  )
}

export { toast } from "sonner"

// Add a useToast hook for compatibility
export function useToast() {
  return {
    toast: {
      success: (message) => toast.success(message),
      error: (message) => toast.error(message),
      info: (message) => toast.info(message),
      warning: (message) => toast.warning(message),
    }
  }
} 