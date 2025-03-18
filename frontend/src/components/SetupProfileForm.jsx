'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SetupProfileForm() {
  const { user } = useUser()
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/manufacturers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: companyName,
          clerk_id: user.id // Send Clerk user ID
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Company name already exists. Please choose another name.')
        }
        throw new Error(data.error || data.details || 'Failed to create manufacturer profile')
      }

      // Refresh the page after successful submission
      window.location.reload()
    } catch (err) {
      console.error('Profile setup error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Complete Your Manufacturer Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <Input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            type="email"
            value={user?.emailAddresses[0]?.emailAddress || ''}
            disabled
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Complete Setup'}
        </Button>
      </form>
    </div>
  )
} 