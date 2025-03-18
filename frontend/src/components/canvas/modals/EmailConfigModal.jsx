'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase"
import { useManufacturer } from "@/hooks/useManufacturer"

export default function EmailConfigModal({ isOpen, onClose, onSave, initialData, isFormView = false }) {
  const supabase = useSupabase()
  const { manufacturer } = useManufacturer()
  const [isVerifying, setIsVerifying] = useState(false)
  const [emailConfig, setEmailConfig] = useState({
    email: initialData?.email || '',
    folder: initialData?.folder || 'INBOX',
    subject_pattern: initialData?.subject_pattern || '',
    manufacturer_id: manufacturer?.id,
    is_verified: initialData?.is_verified || false,
  })

  // Update emailConfig when manufacturer changes
  useEffect(() => {
    if (manufacturer?.id) {
      setEmailConfig(prev => ({
        ...prev,
        manufacturer_id: manufacturer.id
      }))
    }
  }, [manufacturer])

  const handleSave = async () => {
    try {
      if (!manufacturer?.id) {
        throw new Error('Manufacturer ID is required')
      }

      // Ensure manufacturer_id is set in the data
      const configToSave = {
        ...emailConfig,
        manufacturer_id: manufacturer.id
      }

      console.log('Saving email config:', configToSave)

      // Save email configuration to database
      const { data, error } = await supabase
        .from('email_configurations')
        .upsert([configToSave])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Saved email config:', data)

      // Pass back the saved data with additional fields
      onSave({
        ...data,
        manufacturer_id: manufacturer.id,
        configured: true,
        type: 'email'
      })
    } catch (error) {
      console.error('Failed to save email configuration:', error)
      // You might want to show an error toast here
    }
  }

  const handleVerifyEmail = () => {
    setIsVerifying(true)
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI)}&response_type=code&scope=https://mail.google.com/&access_type=offline&prompt=consent&state=${emailConfig.email}`
  }

  const handleSubmit = async () => {
    await handleSave()
    if (!isFormView) {
      onClose()
    }
  }

  // If used as a form component rather than modal
  if (isFormView) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Email Configuration</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email to track"
                  value={emailConfig.email}
                  onChange={(e) => setEmailConfig(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                />
                <Button
                  onClick={handleVerifyEmail}
                  disabled={!emailConfig.email || isVerifying}
                  variant="secondary"
                >
                  {isVerifying ? "Verifying..." : "Verify Email"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Folder to Monitor</label>
              <Input
                placeholder="Email folder (e.g., INBOX)"
                value={emailConfig.folder}
                onChange={(e) => setEmailConfig(prev => ({
                  ...prev,
                  folder: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Pattern (Optional)</label>
              <Input
                placeholder="e.g., Order #*"
                value={emailConfig.subject_pattern}
                onChange={(e) => setEmailConfig(prev => ({
                  ...prev,
                  subject_pattern: e.target.value
                }))}
              />
              <p className="text-sm text-gray-500">
                Use * as wildcard. Leave empty to process all emails.
              </p>
            </div>
            <Button 
              onClick={handleSubmit}
              className="w-full mt-4" 
              disabled={!emailConfig.email || isVerifying}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Email Configuration</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email to track"
                value={emailConfig.email}
                onChange={(e) => setEmailConfig(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
              />
              <Button
                onClick={handleVerifyEmail}
                disabled={!emailConfig.email || isVerifying}
                variant="secondary"
              >
                {isVerifying ? "Verifying..." : "Verify Email"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Folder to Monitor</label>
            <Input
              placeholder="Email folder (e.g., INBOX)"
              value={emailConfig.folder}
              onChange={(e) => setEmailConfig(prev => ({
                ...prev,
                folder: e.target.value
              }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject Pattern (Optional)</label>
            <Input
              placeholder="e.g., Order #*"
              value={emailConfig.subject_pattern}
              onChange={(e) => setEmailConfig(prev => ({
                ...prev,
                subject_pattern: e.target.value
              }))}
            />
            <p className="text-sm text-gray-500">
              Use * as wildcard. Leave empty to process all emails.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 