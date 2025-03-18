'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { useSupabase } from '@/lib/supabase'
import { useManufacturer } from '@/hooks/useManufacturer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default function InvoiceTemplatePage() {
  const supabase = useSupabase()
  const { manufacturer } = useManufacturer()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState({
    header_text: '',
    footer_text: '',
    company_details: '',
    logo_url: '',
    additional_notes: ''
  })
  const [preview, setPreview] = useState(false)
  
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!manufacturer?.id) return
      
      setLoading(true)
      const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('manufacturer_id', manufacturer.id)
        .single()
      
      if (error && error.code !== 'PGSQL_EMPTY_RESULT') {
        console.error('Error fetching template:', error)
        toast({
          title: 'Error',
          description: 'Failed to load invoice template',
          variant: 'destructive'
        })
      }
      
      if (data) {
        setTemplate(data)
      }
      
      setLoading(false)
    }
    
    fetchTemplate()
  }, [manufacturer, supabase])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!manufacturer?.id) return
    
    setSaving(true)
    
    const { data: existingTemplate } = await supabase
      .from('invoice_templates')
      .select('id')
      .eq('manufacturer_id', manufacturer.id)
      .single()
    
    let result
    
    if (existingTemplate) {
      // Update existing template
      result = await supabase
        .from('invoice_templates')
        .update({
          header_text: template.header_text,
          footer_text: template.footer_text,
          company_details: template.company_details,
          logo_url: template.logo_url,
          additional_notes: template.additional_notes
        })
        .eq('id', existingTemplate.id)
    } else {
      // Create new template
      result = await supabase
        .from('invoice_templates')
        .insert({
          manufacturer_id: manufacturer.id,
          header_text: template.header_text,
          footer_text: template.footer_text,
          company_details: template.company_details,
          logo_url: template.logo_url,
          additional_notes: template.additional_notes
        })
    }
    
    setSaving(false)
    
    if (result.error) {
      console.error('Error saving template:', result.error)
      toast({
        title: 'Error',
        description: 'Failed to save invoice template',
        variant: 'destructive'
      })
    } else {
      toast.success('Invoice template saved successfully')
    }
  }
  
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Logo file must be less than 2MB',
        variant: 'destructive'
      })
      return
    }
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${manufacturer.id}-logo.${fileExt}`
    
    // Upload file to storage
    const { data, error } = await supabase
      .storage
      .from('logos')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      })
    
    if (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive'
      })
      return
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('logos')
      .getPublicUrl(fileName)
    
    setTemplate({
      ...template,
      logo_url: publicUrl
    })
    
    toast.success('Logo uploaded successfully')
  }
  
  const handlePreview = async () => {
    if (!manufacturer?.id) return
    
    try {
      const response = await fetch('/api/invoices/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manufacturerId: manufacturer.id,
          template
        }),
      })
      
      if (response.ok) {
        // Create a URL for the blob (PDF blob now)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        // Open in new tab (should work for PDF)
        window.open(url, '_blank')
        
        // Clean up
        window.URL.revokeObjectURL(url)
      } else {
        console.error("Error previewing invoice:", response.statusText)
        toast({
          title: 'Error',
          description: 'Failed to generate invoice preview',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error("Error previewing invoice:", error)
      toast({
        title: 'Error',
        description: 'Failed to generate invoice preview',
        variant: 'destructive'
      })
    }
  }
  
  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }
  
  return (
    <div className="container py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Invoice Template Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize how your invoices will look when downloaded as PDF
        </p>
      </div>
      
      <Tabs defaultValue="edit">
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Edit Template</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Add your business details to the invoice</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_details">Company Details</Label>
                    <Textarea
                      id="company_details"
                      placeholder="Address, Phone, Email, Website, etc."
                      value={template.company_details}
                      onChange={(e) => setTemplate({...template, company_details: e.target.value})}
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logo">Company Logo</Label>
                    <div className="flex items-center gap-4">
                      {template.logo_url && (
                        <div className="relative h-16 w-32 border rounded overflow-hidden">
                          <img 
                            src={template.logo_url} 
                            alt="Company Logo" 
                            className="object-contain h-full w-full"
                          />
                        </div>
                      )}
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a logo (max 2MB). Recommended size: 300x150px.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Text</CardTitle>
                  <CardDescription>Customize the text that appears on your invoices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="header_text">Header Text</Label>
                    <Textarea
                      id="header_text"
                      placeholder="Text to display at the top of the invoice"
                      value={template.header_text}
                      onChange={(e) => setTemplate({...template, header_text: e.target.value})}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Footer Text</Label>
                    <Textarea
                      id="footer_text"
                      placeholder="Text to display at the bottom of the invoice"
                      value={template.footer_text}
                      onChange={(e) => setTemplate({...template, footer_text: e.target.value})}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="additional_notes">Additional Notes</Label>
                    <Textarea
                      id="additional_notes"
                      placeholder="Terms and conditions, payment instructions, etc."
                      value={template.additional_notes}
                      onChange={(e) => setTemplate({...template, additional_notes: e.target.value})}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
              >
                Preview Invoice
              </Button>
              
              <Button 
                type="submit"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="preview" className="relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
            >
              Open Full Preview
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Invoice Preview</CardTitle>
              <CardDescription>
                This is how your invoice will look when downloaded as a PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded p-6 bg-white min-h-[600px]">
                {/* Simple visual preview */}
                <div className="border-b pb-4 mb-4 flex items-start justify-between">
                  {template.logo_url && (
                    <div className="w-1/4">
                      <img 
                        src={template.logo_url} 
                        alt="Company Logo" 
                        className="max-h-16 object-contain"
                      />
                    </div>
                  )}
                  <div className="w-3/4 text-right">
                    <h2 className="text-lg font-bold mb-1">{manufacturer?.company_name || 'Your Company'}</h2>
                    <p className="text-sm whitespace-pre-line">{template.company_details || 'Company Address and Contact Details'}</p>
                  </div>
                </div>
                
                <div className="text-center my-4">
                  <h1 className="text-2xl font-bold">INVOICE</h1>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-medium mb-2">Bill To:</h3>
                    <p className="text-sm">Client Name</p>
                    <p className="text-sm">Client Address</p>
                    <p className="text-sm">Client Email</p>
                    <p className="text-sm">Client Phone</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm"><span className="font-medium">Invoice #:</span> INV-12345</p>
                    <p className="text-sm"><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="my-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">#</th>
                        <th className="border p-2 text-left">Description</th>
                        <th className="border p-2 text-right">Qty</th>
                        <th className="border p-2 text-right">Unit Price</th>
                        <th className="border p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">1</td>
                        <td className="border p-2">Sample Product</td>
                        <td className="border p-2 text-right">2</td>
                        <td className="border p-2 text-right">$25.00</td>
                        <td className="border p-2 text-right">$50.00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">2</td>
                        <td className="border p-2">Another Product</td>
                        <td className="border p-2 text-right">1</td>
                        <td className="border p-2 text-right">$35.00</td>
                        <td className="border p-2 text-right">$35.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end mb-4">
                  <div className="w-1/3">
                    <div className="flex justify-between py-1">
                      <span>Subtotal:</span>
                      <span>$85.00</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Tax:</span>
                      <span>$8.50</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold">
                      <span>Total:</span>
                      <span>$93.50</span>
                    </div>
                  </div>
                </div>
                
                {template.additional_notes && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="font-medium mb-2">Notes:</h3>
                    <p className="text-sm">{template.additional_notes}</p>
                  </div>
                )}
                
                {template.header_text && (
                  <div className="mt-4">
                    <p className="text-sm">{template.header_text}</p>
                  </div>
                )}
                
                {template.footer_text && (
                  <div className="mt-6 border-t pt-4 text-center text-sm text-gray-500">
                    <p>{template.footer_text}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 