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

export default function ProductConfigModal({ isOpen, onClose, onSave, initialData, isFormView = false }) {
  const supabase = useSupabase()
  const { manufacturer } = useManufacturer()
  const [productConfig, setProductConfig] = useState({
    products: initialData?.products || [],
    manufacturer_id: manufacturer?.id
  })
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch existing products for this manufacturer
  useEffect(() => {
    const fetchProducts = async () => {
      if (!manufacturer?.id) return
      
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('manufacturer_id', manufacturer.id)
          .order('name')

        if (error) throw error
        setProductConfig(prev => ({
          ...prev,
          products: data
        }))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && manufacturer?.id) {
      fetchProducts()
    }
  }, [isOpen, manufacturer?.id])

  // Update config when manufacturer changes
  useEffect(() => {
    if (manufacturer?.id) {
      setProductConfig(prev => ({
        ...prev,
        manufacturer_id: manufacturer.id
      }))
    }
  }, [manufacturer])

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.sku) return

    const updatedProducts = [
      ...productConfig.products,
      {
        id: crypto.randomUUID(),
        name: newProduct.name,
        sku: newProduct.sku,
        price: parseFloat(newProduct.price) || 0
      }
    ]

    setProductConfig(prev => ({
      ...prev,
      products: updatedProducts
    }))

    setNewProduct({
      name: '',
      sku: '',
      price: ''
    })
  }

  const handleRemoveProduct = (productId) => {
    const updatedProducts = productConfig.products.filter(
      product => product.id !== productId
    )
    
    setProductConfig(prev => ({
      ...prev,
      products: updatedProducts
    }))
  }

  const handleSubmit = () => {
    onSave({
      ...productConfig,
      configured: true,
      type: 'product',
      label: 'Product Configuration',
      productCount: productConfig.products.length
    })
    
    if (!isFormView) {
      onClose()
    }
  }

  const renderContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className={isFormView ? "text-lg font-medium mb-4" : "hidden"}>Product Configuration</h3>
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
            <h4 className="text-sm font-medium mb-2">Product List ({productConfig.products.length})</h4>
            {productConfig.products.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No products added yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {productConfig.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-500 flex gap-3">
                        <span>SKU: {product.sku}</span>
                        <span>Price: ${product.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {isFormView && (
            <Button 
              onClick={handleSubmit}
              className="w-full mt-4" 
              disabled={productConfig.products.length === 0}
            >
              Save Configuration
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  if (isFormView) {
    return renderContent()
  }

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
            onClick={handleSubmit}
            disabled={productConfig.products.length === 0}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 