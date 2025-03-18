'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase"
import { X } from "lucide-react"

export default function ExceptionConfigModal({ isOpen, onClose, onSave, initialData }) {
  const supabase = useSupabase()
  const [products, setProducts] = useState([])
  const [exceptions, setExceptions] = useState(initialData?.exceptions || [])
  const [newException, setNewException] = useState({
    product_id: '',
    rule_type: 'quantity_min',
    value: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch products for selection
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, sku')
          .eq('manufacturer_id', initialData?.manufacturer_id)
          .order('name')

        if (error) throw error
        setProducts(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && initialData?.manufacturer_id) {
      fetchProducts()
    }
  }, [isOpen, initialData?.manufacturer_id])

  const handleAddException = async () => {
    try {
      const { data, error } = await supabase
        .from('product_exceptions')
        .insert([{
          ...newException,
          manufacturer_id: initialData?.manufacturer_id
        }])
        .select(`
          *,
          products (
            name,
            sku
          )
        `)
        .single()

      if (error) throw error

      setExceptions([...exceptions, data])
      setNewException({
        product_id: '',
        rule_type: 'quantity_min',
        value: '',
        message: ''
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemoveException = async (exceptionId) => {
    try {
      const { error } = await supabase
        .from('product_exceptions')
        .delete()
        .eq('id', exceptionId)

      if (error) throw error

      setExceptions(exceptions.filter(e => e.id !== exceptionId))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSave = () => {
    onSave({
      exceptions,
      configured: true,
      ruleCount: exceptions.length
    })
    onClose()
  }

  const ruleTypes = [
    { value: 'quantity_min', label: 'Minimum Quantity' },
    { value: 'quantity_max', label: 'Maximum Quantity' },
    { value: 'price_min', label: 'Minimum Price' },
    { value: 'price_max', label: 'Maximum Price' }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Product Exceptions Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {/* Add new exception form */}
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
            disabled={!newException.product_id || !newException.value || !newException.message}
          >
            Add Exception Rule
          </Button>

          {/* Exception list */}
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Exception Rules</h3>
            {loading ? (
              <div>Loading exceptions...</div>
            ) : (
              <div className="space-y-2">
                {exceptions.map((exception) => (
                  <div 
                    key={exception.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">
                        {exception.products?.name} ({exception.products?.sku})
                      </div>
                      <div className="text-sm text-gray-500">
                        {ruleTypes.find(t => t.value === exception.rule_type)?.label}: {exception.value}
                      </div>
                      <div className="text-xs text-gray-400">
                        {exception.message}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveException(exception.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 