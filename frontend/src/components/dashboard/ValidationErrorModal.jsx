'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon, EnvelopeIcon } from "@heroicons/react/24/outline"
import { Textarea } from "@/components/ui/textarea"
import { useSupabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ValidationErrorModal({ isOpen, onClose, order, refreshOrders }) {
  const [processing, setProcessing] = useState(false)
  const [resolution, setResolution] = useState("")
  const [products, setProducts] = useState({})
  const [activeTab, setActiveTab] = useState("details")
  const supabase = useSupabase()

  useEffect(() => {
    if (order && order.items) {
      const fetchProducts = async () => {
        const productIds = order.items
          .map(item => item.product_id)
          .filter(Boolean)
        
        if (productIds.length > 0) {
          const { data, error } = await supabase
            .from('products')
            .select('id, name')
            .in('id', productIds)
          
          if (!error && data) {
            const productMap = {}
            data.forEach(product => {
              productMap[product.id] = product
            })
            setProducts(productMap)
          } else {
            console.error('Error fetching products:', error)
          }
        }
      }
      
      fetchProducts()
    }
  }, [order, supabase])

  useEffect(() => {
    // Reset resolution when order changes
    setResolution("")
    setActiveTab("details")
  }, [order])

  if (!order) return null

  const handleResolveValidation = async (status) => {
    setProcessing(true)

    try {
      // Update the order marking validation resolved
      const { error } = await supabase
        .from('orders')
        .update({
          processing_status: status === 'approved' ? 'processing' : 'failed',
          special_request_resolution: resolution,
          validation_errors: null, // Clear validation errors
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select()

      if (error) throw error

      toast.success(`Order validation ${status === 'approved' ? 'approved' : 'rejected'} successfully`)
      if (refreshOrders) refreshOrders()
      onClose()
    } catch (error) {
      console.error('Error resolving validation:', error)
      toast.error('Failed to update order status')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Validation Error</DialogTitle>
            <Badge 
              variant="outline" 
              className="bg-red-100 text-red-800 border-red-200"
            >
              <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
              Error
            </Badge>
          </div>
          <DialogDescription>
            Order #{order.order_number} from {order.retailer?.business_name || 'Unknown'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="details">Error Details</TabsTrigger>
            <TabsTrigger value="email">
              Email
              <EnvelopeIcon className="h-3 w-3 ml-1" />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Validation Error Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Validation Error Details</h3>
              <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800 font-medium">
                  {order.validation_errors?.reason || 
                   order.email_parsed_data?.orderDetails?.products?.reason || 
                   "There was an error validating the order, but details were not provided."}
                </p>
                
                <div className="mt-2 text-xs text-red-700">
                  <p>This order requires manual verification due to parsing issues.</p>
                  <p className="mt-1">Please check the email content for accurate quantities and products before approving.</p>
                </div>
              </div>
            </div>

            {/* Order Items Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Order Items</h3>
              <div className="max-h-60 overflow-y-auto rounded-lg mt-2 border">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div 
                      key={`${item.product_id}-${index}-${order.id}`}
                      className="flex justify-between py-2 px-3 border-b"
                    >
                      <div>
                        {item.product_name || products[item.product_id]?.name || `Product #${item.product_id || 'Unknown'}`}
                      </div>
                      <div className="font-medium">Qty: {item.quantity}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No order items available - parsing error may have prevented item creation
                  </div>
                )}
              </div>
            </div>
            
            {/* Retailer Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm"><span className="font-medium">Business:</span> {order.retailer?.business_name || 'Unknown'}</p>
                <p className="text-sm"><span className="font-medium">Contact:</span> {order.retailer?.contact_name || 'Unknown'}</p>
                <p className="text-sm"><span className="font-medium">Email:</span> {order.retailer?.email || 'Unknown'}</p>
              </div>
            </div>
          </TabsContent>
          
          {/* Email Tab Content */}
          <TabsContent value="email" className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500">Subject:</div>
                <div className="text-sm">{order.email_subject || 'No subject'}</div>
              </div>
              
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500">From:</div>
                <div className="text-sm">{order.retailer?.email || 'Unknown'}</div>
              </div>
              
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500">Email Body:</div>
                <div className="bg-white p-3 rounded border mt-1 max-h-60 overflow-y-auto whitespace-pre-wrap text-sm">
                  {order.email_body || 'No email body'}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-4">
          <h3 className="text-sm font-medium text-gray-500">Resolution Notes</h3>
          <Textarea 
            className="mt-1"
            placeholder="Enter any notes about your decision..." 
            value={resolution}
            onChange={e => setResolution(e.target.value)}
          />
        </div>

        <DialogFooter className="flex gap-3 sm:gap-0 mt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={processing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleResolveValidation('rejected')}
            disabled={processing}
            className="flex-1"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            variant="default"
            onClick={() => handleResolveValidation('approved')}
            disabled={processing}
            className="flex-1"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Manual Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 