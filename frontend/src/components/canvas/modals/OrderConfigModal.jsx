import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export default function OrderConfigModal({ isOpen, onClose, onSave }) {
  const [orderRules, setOrderRules] = useState({
    minAmount: '',
    requiredFields: []
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order Processing Rules</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input 
            label="Minimum Order Amount"
            value={orderRules.minAmount}
            onChange={e => setOrderRules(prev => ({ ...prev, minAmount: e.target.value }))}
          />
          {/* Add more order processing fields */}
        </div>
      </DialogContent>
    </Dialog>
  )
} 