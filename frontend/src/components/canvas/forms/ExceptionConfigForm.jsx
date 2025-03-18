'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabase } from "@/lib/supabase"
import { useManufacturer } from "@/hooks/useManufacturer"

const ruleTypes = [
  { value: 'min_quantity', label: 'Minimum Quantity' },
  { value: 'max_quantity', label: 'Maximum Quantity' },
  { value: 'min_price', label: 'Minimum Price' },
  { value: 'max_price', label: 'Maximum Price' }
]

export default function ExceptionConfigForm({ onSave, initialData }) {
  const supabase = useSupabase()
  const { manufacturer } = useManufacturer()
  const [exceptions, setExceptions] = useState(initialData?.exceptions || [])
  const [products, setProducts] = useState([])
  const [newException, setNewException] = useState({
    product_id: '',
    rule_type: '',
    value: '',
    message: '',
    manufacturer_id: manufacturer?.id
  })

  useEffect(() => {
    const loadProducts = async () => {
      if (manufacturer?.id) {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('manufacturer_id', manufacturer.id)
        
        if (data) setProducts(data)
      }
    }

    loadProducts()
  }, [manufacturer, supabase])

  const handleAddException = async () => {
    try {
      if (!manufacturer?.id) {
        throw new Error('Manufacturer ID is required')
      }

      const { data, error } = await supabase
        .from('product_exceptions')
        .insert([{ ...newException, manufacturer_id: manufacturer.id }])
        .select()
        .single()

      if (error) throw error

      setExceptions([...exceptions, data])
      setNewException({
        product_id: '',
        rule_type: '',
        value: '',
        message: '',
        manufacturer_id: manufacturer.id
      })
    } catch (error) {
      console.error('Failed to add exception:', error)
    }
  }

  const handleSave = () => {
    onSave({
      exceptions,
      configured: true,
      type: 'exception',
      ruleCount: exceptions.length
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add New Exception</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select
            value={newException.product_id}
            onValueChange={(value) => setNewException(prev => ({
              ...prev,
              product_id: value
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={newException.rule_type}
            onValueChange={(value) => setNewException(prev => ({
              ...prev,
              rule_type: value
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Rule Type" />
            </SelectTrigger>
            <SelectContent>
              {ruleTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Value"
            value={newException.value}
            onChange={(e) => setNewException(prev => ({
              ...prev,
              value: e.target.value
            }))}
          />

          <Input
            placeholder="Error Message"
            value={newException.message}
            onChange={(e) => setNewException(prev => ({
              ...prev,
              message: e.target.value
            }))}
          />
        </div>
        <Button 
          onClick={handleAddException}
          disabled={!newException.product_id || !newException.rule_type || !newException.value}
        >
          Add Exception
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Exception Rules</h3>
        <div className="space-y-2">
          {exceptions.map((exception) => (
            <div 
              key={exception.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <div>
                <div className="font-medium">
                  {products.find(p => p.id === exception.product_id)?.name}
                </div>
                <div className="text-sm text-gray-500">
                  {ruleTypes.find(r => r.value === exception.rule_type)?.label}: {exception.value}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {exception.message}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button 
        onClick={handleSave}
        className="w-full"
        disabled={exceptions.length === 0}
      >
        {initialData?.configured ? 'Update Exceptions' : 'Save Exceptions'}
      </Button>
    </div>
  )
} 