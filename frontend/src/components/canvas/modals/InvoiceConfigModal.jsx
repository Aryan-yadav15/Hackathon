'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useManufacturer } from '@/hooks/useManufacturer'

export default function InvoiceConfigModal({ isOpen, onClose, onSave, initialData, isFormView = false }) {
  const { manufacturer } = useManufacturer()
  const [invoiceConfig, setInvoiceConfig] = useState({
    company_name: initialData?.company_name || manufacturer?.name || '',
    company_address: initialData?.company_address || '',
    company_phone: initialData?.company_phone || '',
    company_email: initialData?.company_email || '',
    include_logo: initialData?.include_logo || true,
    invoice_notes: initialData?.invoice_notes || '',
    payment_terms: initialData?.payment_terms || 'Net 30',
    manufacturer_id: manufacturer?.id
  })

  // Update config when manufacturer changes
  useEffect(() => {
    if (manufacturer?.id) {
      setInvoiceConfig(prev => ({
        ...prev,
        company_name: prev.company_name || manufacturer.name,
        manufacturer_id: manufacturer.id
      }))
    }
  }, [manufacturer])

  const handleSubmit = () => {
    onSave({
      ...invoiceConfig,
      configured: true,
      type: 'invoice',
      label: 'Invoice Template'
    })
    
    if (!isFormView) {
      onClose()
    }
  }

  const renderContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className={isFormView ? "text-lg font-medium mb-4" : "hidden"}>Invoice Template Configuration</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={invoiceConfig.company_name}
              onChange={(e) => setInvoiceConfig(prev => ({ ...prev, company_name: e.target.value }))}
              placeholder="Your Company Name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-address">Company Address</Label>
            <Textarea
              id="company-address"
              value={invoiceConfig.company_address}
              onChange={(e) => setInvoiceConfig(prev => ({ ...prev, company_address: e.target.value }))}
              placeholder="123 Business St, City, State, ZIP"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-phone">Phone Number</Label>
              <Input
                id="company-phone"
                value={invoiceConfig.company_phone}
                onChange={(e) => setInvoiceConfig(prev => ({ ...prev, company_phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input
                id="company-email"
                value={invoiceConfig.company_email}
                onChange={(e) => setInvoiceConfig(prev => ({ ...prev, company_email: e.target.value }))}
                placeholder="invoices@yourcompany.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-terms">Payment Terms</Label>
            <Input
              id="payment-terms"
              value={invoiceConfig.payment_terms}
              onChange={(e) => setInvoiceConfig(prev => ({ ...prev, payment_terms: e.target.value }))}
              placeholder="Net 30"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="invoice-notes">Default Invoice Notes</Label>
            <Textarea
              id="invoice-notes"
              value={invoiceConfig.invoice_notes}
              onChange={(e) => setInvoiceConfig(prev => ({ ...prev, invoice_notes: e.target.value }))}
              placeholder="Thank you for your business!"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="include-logo"
              checked={invoiceConfig.include_logo}
              onCheckedChange={(checked) => setInvoiceConfig(prev => ({ ...prev, include_logo: checked }))}
            />
            <Label htmlFor="include-logo">Include Company Logo</Label>
          </div>
          
          {isFormView && (
            <Button 
              onClick={handleSubmit}
              className="w-full mt-4" 
              disabled={!invoiceConfig.company_name}
            >
              Save Configuration
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  if (isFormView) {
    return renderContent()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invoice Template</DialogTitle>
        </DialogHeader>
        
        {renderContent()}
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!invoiceConfig.company_name}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 