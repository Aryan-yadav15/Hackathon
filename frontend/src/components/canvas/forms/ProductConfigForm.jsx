'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/lib/supabase"
import { useManufacturer } from "@/hooks/useManufacturer"

export default function ProductConfigForm({ onSave, initialData }) {
  const supabase = useSupabase()
  const { manufacturer } = useManufacturer()
  const [products, setProducts] = useState(initialData?.products || [])
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: '',
    manufacturer_id: manufacturer?.id
  })

  const handleAddProduct = async () => {
    try {
      if (!manufacturer?.id) {
        throw new Error('Manufacturer ID is required')
      }

      const { data, error } = await supabase
        .from('products')
        .insert([{ ...newProduct, manufacturer_id: manufacturer.id }])
        .select()
        .single()

      if (error) throw error

      setProducts([...products, data])
      setNewProduct({
        name: '',
        sku: '',
        price: '',
        manufacturer_id: manufacturer.id
      })
    } catch (error) {
      console.error('Failed to add product:', error)
    }
  }

  const handleSave = () => {
    onSave({
      products,
      configured: true,
      type: 'product',
      productCount: products.length
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add New Product</h3>
        <div className="grid grid-cols-3 gap-4">
          <Input
            placeholder="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct(prev => ({
              ...prev,
              name: e.target.value
            }))}
          />
          <Input
            placeholder="SKU"
            value={newProduct.sku}
            onChange={(e) => setNewProduct(prev => ({
              ...prev,
              sku: e.target.value
            }))}
          />
          <Input
            type="number"
            placeholder="Price"
            value={newProduct.price}
            onChange={(e) => setNewProduct(prev => ({
              ...prev,
              price: e.target.value
            }))}
          />
        </div>
        <Button 
          onClick={handleAddProduct}
          disabled={!newProduct.name || !newProduct.sku || !newProduct.price}
        >
          Add Product
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Product List</h3>
        <div className="space-y-2">
          {products.map((product) => (
            <div 
              key={product.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <div>
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-gray-500">
                  SKU: {product.sku}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  ${product.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button 
        onClick={handleSave}
        className="w-full"
        disabled={products.length === 0}
      >
        {initialData?.configured ? 'Update Products' : 'Save Products'}
      </Button>
    </div>
  )
} 