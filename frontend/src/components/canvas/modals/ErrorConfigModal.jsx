import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function ErrorConfigModal({ isOpen, onClose }) {
  const [retrySettings, setRetrySettings] = useState({
    maxRetries: 3,
    retryInterval: '30m'
  })

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error Handling Configuration</DialogTitle>
        </DialogHeader>
        {/* Add error handling configuration UI */}
      </DialogContent>
    </Dialog>
  )
} 
 