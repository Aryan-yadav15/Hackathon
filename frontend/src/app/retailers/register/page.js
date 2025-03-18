'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useSupabase } from "@/lib/supabase"

export default function RetailerRegister() {
  const router = useRouter()
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [manufacturers, setManufacturers] = useState([])
  const [formData, setFormData] = useState({
    manufacturer_id: '',
    business_name: '',
    contact_name: '',
    email: '',
    address: '',
    phone: ''
  })

  // Fetch manufacturers list
  useEffect(() => {
    const fetchManufacturers = async () => {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('id, company_name')

      if (error) {
        console.error('Error fetching manufacturers:', error)
        toast.error("Failed to load manufacturers")
        return
      }

      setManufacturers(data || [])
    }

    fetchManufacturers()
  }, [supabase])

  const validateForm = () => {
    if (!formData.manufacturer_id) {
      toast.error("Please select a manufacturer")
      return false
    }
    if (!formData.business_name.trim()) {
      toast.error("Business name is required")
      return false
    }
    if (!formData.contact_name.trim()) {
      toast.error("Contact name is required")
      return false
    }
    if (!formData.email.trim()) {
      toast.error("Email is required")
      return false
    }
    if (!formData.address.trim()) {
      toast.error("Address is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)

    try {
      // Check if email already exists for this manufacturer
      const { data: existingRetailer, error: checkError } = await supabase
        .from('retailers')
        .select('id')
        .eq('manufacturer_id', formData.manufacturer_id)
        .eq('email', formData.email)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw checkError
      }

      if (existingRetailer) {
        toast.error("A retailer with this email already exists for this manufacturer")
        setLoading(false)
        return
      }

      // Create retailer
      const { error: insertError } = await supabase
        .from('retailers')
        .insert([{
          manufacturer_id: formData.manufacturer_id,
          business_name: formData.business_name.trim(),
          contact_name: formData.contact_name.trim(),
          email: formData.email.trim().toLowerCase(),
          address: formData.address.trim(),
          phone: formData.phone.trim()
        }])

      if (insertError) throw insertError

      toast.success("Registration successful!")
      router.push('/retailers/success')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.message || "Failed to register. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Retailer Registration
          </CardTitle>
          <CardDescription>
            Register as a retailer for your chosen manufacturer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Select Manufacturer</Label>
                <Select
                  required
                  value={formData.manufacturer_id}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    manufacturer_id: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((manufacturer) => (
                      <SelectItem key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    business_name: e.target.value
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Person Name</Label>
                <Input
                  id="contact_name"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact_name: e.target.value
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    phone: e.target.value
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: e.target.value
                  }))}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Registering...
                </div>
              ) : (
                'Register'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 