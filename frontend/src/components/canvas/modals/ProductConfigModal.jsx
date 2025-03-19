'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { DialogFooter } from "@/components/ui/dialog"
import { useSupabase } from "@/lib/supabase"
import { useManufacturer } from "@/hooks/useManufacturer"
import { Label } from "@/components/ui/label"

export default function ProductConfigModal({ isOpen, onClose, onSave, initialData = {} }) {
  const supabase = useSupabase()
  const { manufacturer } = useManufacturer()
  const [products, setProducts] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState(initialData.productIds || [])
  const [isLoading, setIsLoading] = useState(true)
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: ''
  })
  const [error, setError] = useState(null)

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        // Get manufacturer ID from user context if available, or use initialData
        const manufacturerId = initialData.manufacturer_id
        
        if (!manufacturerId) {
          console.error('No manufacturer ID available')
          setIsLoading(false)
          return
        }
        
        console.log('Fetching products for manufacturer:', manufacturerId)
        
        const { data, error } = await supabase
          .from('products')
          .select('id, name, sku, price')
          .eq('manufacturer_id', manufacturerId)
        
        if (error) {
          console.error('Error fetching products:', error)
          return
        }
        
        console.log('Fetched products:', data)
        setProducts(data || [])
        
        // Initialize selected products based on initialData
        if (initialData.productIds) {
          console.log('Initial product IDs:', initialData.productIds)
          // Make sure IDs are numbers
          const numericIds = initialData.productIds.map(id => 
            typeof id === 'string' ? parseInt(id, 10) : id
          ).filter(id => !isNaN(id))
          
          setSelectedProductIds(numericIds)
          console.log('Set selected product IDs:', numericIds)
        }
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    // Always fetch products when in form view
    if (isOpen || initialData.isFormView) {
      fetchProducts()
    }
  }, [isOpen, initialData])

  const handleAddProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.sku) return
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          ...newProduct,
          manufacturer_id: manufacturer.id,
          price: parseFloat(newProduct.price)
        })
      })

      if (!response.ok) throw new Error('Failed to save product')
      
      const savedProduct = await response.json()
      
      const updatedProducts = [...products, savedProduct]
      setProducts(updatedProducts)
      
    } catch (error) {
      console.error('Product save failed:', error)
      setError(error.message)
    }
  }

  const handleRemoveProduct = (productId) => {
    const updatedProducts = products.filter(
      product => product.id !== productId
    )
    
    setProducts(updatedProducts)
  }

  const handleSave = () => {
    // Make sure we're sending numeric IDs
    const numericIds = selectedProductIds.map(id => 
      typeof id === 'string' ? parseInt(id, 10) : id
    ).filter(id => !isNaN(id))
    
    console.log('Saving product node with IDs:', numericIds)
    
    onSave({
      ...initialData,
      productIds: numericIds,
      configured: true,
      productCount: numericIds.length
    })
  }

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
    console.log(`Toggled product ${productId}, new selection:`, 
      selectedProductIds.includes(productId) 
        ? selectedProductIds.filter(id => id !== productId)
        : [...selectedProductIds, productId]
    );
  }

  const renderContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Product Configuration</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-5">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Product name"
              />
            </div>
            <div className="col-span-3">
              <Label htmlFor="product-sku">SKU</Label>
              <Input
                id="product-sku"
                value={newProduct.sku}
                onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="SKU"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="product-price">Price</Label>
              <Input
                id="product-price"
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="col-span-2 flex items-end">
              <Button
                onClick={handleAddProduct}
                disabled={!newProduct.name || !newProduct.sku}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">
              Product List ({products.length}) - Selected: {selectedProductIds.length}
            </h4>
            {!isLoading ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                      selectedProductIds.includes(product.id) 
                        ? 'bg-blue-50 border-blue-200 border' 
                        : 'bg-gray-50'
                    }`}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-500 flex gap-3">
                        <span>SKU: {product.sku}</span>
                        <span>Price: ${product.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="h-4 w-4 text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveProduct(product.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">Loading products...</p>
              </div>
            )}
          </div>
          
          {isLoading && (
            <Button 
              onClick={handleSave}
              className="w-full mt-4" 
              disabled={selectedProductIds.length === 0}
            >
              Save Configuration
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Product Configuration</DialogTitle>
        </DialogHeader>
        
        {renderContent()}
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={selectedProductIds.length === 0}
          >
            Save ({selectedProductIds.length} products)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 