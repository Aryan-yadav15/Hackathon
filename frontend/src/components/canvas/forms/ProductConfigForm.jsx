'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useManufacturer } from "@/hooks/useManufacturer"
import { toast } from "@/components/ui/use-toast"

export default function ProductConfigForm({ onSave, initialData }) {
  const { manufacturer } = useManufacturer()
  const [products, setProducts] = useState(initialData?.products || [])
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: '',
    manufacturer_id: manufacturer?.id
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (manufacturer?.id) {
      loadProducts()
    }
  }, [manufacturer?.id])

  useEffect(() => {
    const loadProductsFromIds = async () => {
      if (initialData?.productIds?.length > 0 && (!products || products.length === 0)) {
        try {
          setIsLoading(true)
          console.log('Loading products from IDs:', initialData.productIds)
          
          const idString = initialData.productIds.join(',')
          const response = await fetch(`/api/products?ids=${idString}`)
          
          if (!response.ok) {
            throw new Error('Failed to load products by IDs')
          }
          
          const data = await response.json()
          console.log('Loaded products by IDs:', data)
          
          if (data && data.length > 0) {
            setProducts(data)
          }
        } catch (err) {
          console.error('Failed to load products from IDs:', err)
          setError('Could not load saved products')
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    loadProductsFromIds()
  }, [initialData?.productIds])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/products?manufacturer_id=${manufacturer.id}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to load products')
      }
      
      const data = await response.json()
      setProducts(data || [])
    } catch (err) {
      console.error('Failed to load products:', err)
      setError('Could not load products')
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (!manufacturer?.id) {
        throw new Error('Manufacturer ID is required')
      }

      if (!newProduct.name || !newProduct.sku || !newProduct.price) {
        throw new Error('All fields are required')
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newProduct,
          manufacturer_id: manufacturer.id,
          price: parseFloat(newProduct.price)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add product')
      }

      const data = await response.json()

      setProducts([...products, data])
      
      setNewProduct({
        name: '',
        sku: '',
        price: '',
        manufacturer_id: manufacturer.id
      })
      
      toast({
        title: "Success",
        description: "Product added successfully",
        variant: "success"
      })
    } catch (err) {
      console.error('Failed to add product:', err)
      setError(err.message)
      toast({
        title: "Error",
        description: err.message || "Failed to add product",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    // Debug log to see product IDs
    console.log('Products being saved:', products);
    
    const productIds = products.map(product => {
      // Ensure we're only using the numeric ID part
      if (typeof product.id === 'string') {
        // If it has non-numeric characters, extract just the numbers
        const matches = product.id.match(/\d+/);
        if (matches && matches[0]) {
          return parseInt(matches[0], 10);
        }
        // If it's a numeric string, convert to integer
        if (!isNaN(product.id)) {
          return parseInt(product.id, 10);
        }
      }
      // If it's already a number, use it directly
      return product.id;
    });
    
    // Debug to see productIds after processing
    console.log('Processed productIds:', productIds);
    
    onSave({
      productIds,
      configured: true,
      type: 'product',
      productCount: products.length
    });
    
    toast({
      title: "Success",
      description: "Product configuration saved",
      variant: "success"
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-800 text-sm">
          {error}
        </div>
      )}
      
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
          disabled={isLoading || !newProduct.name || !newProduct.sku || !newProduct.price}
        >
          {isLoading ? 'Adding...' : 'Add Product'}
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Product List ({products.length})</h3>
        {products.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-md text-gray-500 text-center">
            No products yet. Add your first product above.
          </div>
        ) : (
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
                    ${parseFloat(product.price).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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