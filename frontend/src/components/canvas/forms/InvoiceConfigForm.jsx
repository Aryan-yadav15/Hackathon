'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSupabase } from "@/lib/supabase"
import { useManufacturer } from "@/hooks/useManufacturer"

export default function InvoiceConfigForm({ onSave, initialData }) {
  const supabase = useSupabase()
  const { manufacturer } = useManufacturer()
  const [invoiceConfig, setInvoiceConfig] = useState({
    logo_url: initialData?.logo_url || '',
    header_text: initialData?.header_text || '',
    company_details: initialData?.company_details || '',
    footer_text: initialData?.footer_text || '',
    manufacturer_id: manufacturer?.id
  })

  const handleSave = async () => {
    try {
      if (!manufacturer?.id) {
        throw new Error('Manufacturer ID is required')
      }

      const { data, error } = await supabase
        .from('invoice_templates')
        .upsert([{ ...invoiceConfig, manufacturer_id: manufacturer.id }])
        .select()
        .single()

      if (error) throw error

      onSave({
        ...data,
        configured: true,
        type: 'invoice'
      })
    } catch (error) {
      console.error('Failed to save invoice configuration:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Company Logo URL</label>
          <Input
            placeholder="https://your-logo-url.com/logo.png"
            value={invoiceConfig.logo_url}
            onChange={(e) => setInvoiceConfig(prev => ({
              ...prev,
              logo_url: e.target.value
            }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Header Text</label>
          <Input
            placeholder="Invoice header text"
            value={invoiceConfig.header_text}
            onChange={(e) => setInvoiceConfig(prev => ({
              ...prev,
              header_text: e.target.value
            }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Company Details</label>
          <Textarea
            placeholder="Full company details (address, contact, etc.)"
            value={invoiceConfig.company_details}
            onChange={(e) => setInvoiceConfig(prev => ({
              ...prev,
              company_details: e.target.value
            }))}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Footer Text</label>
          <Textarea
            placeholder="Invoice footer text"
            value={invoiceConfig.footer_text}
            onChange={(e) => setInvoiceConfig(prev => ({
              ...prev,
              footer_text: e.target.value
            }))}
            rows={2}
          />
        </div>
      </div>

      <Button 
        onClick={handleSave}
        className="w-full"
        disabled={!invoiceConfig.company_details}
      >
        {initialData?.configured ? 'Update Template' : 'Save Template'}
      </Button>
    </div>
  )
} 