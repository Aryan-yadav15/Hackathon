'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase'
import { useManufacturer } from '@/hooks/useManufacturer'
import { format } from 'date-fns'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { FileText, ArrowLeft, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

// Status badge component
const StatusBadge = ({ status }) => {
  const statusMap = {
    'pending': { label: 'Pending', variant: 'outline', icon: <Clock className="h-3 w-3 mr-1" /> },
    'processing': { label: 'Processing', variant: 'default', icon: <Clock className="h-3 w-3 mr-1" /> },
    'validated': { label: 'Validated', variant: 'success', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    'invalid': { label: 'Invalid', variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
    'error': { label: 'Error', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
  }
  
  const { label, variant, icon } = statusMap[status] || { label: status, variant: 'outline', icon: null }
  
  return (
    <Badge variant={variant} className="ml-2">
      {icon}
      {label}
    </Badge>
  )
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = useSupabase()
  const { manufacturer } = useManufacturer()
  
  const [order, setOrder] = useState(null)
  const [retailer, setRetailer] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!manufacturer?.id) return
      
      try {
        setLoading(true)
        
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', params.id)
          .eq('manufacturer_id', manufacturer.id)
          .single()
        
        if (orderError) throw orderError
        setOrder(orderData)
        
        // Fetch retailer details
        if (orderData.retailer_id) {
          const { data: retailerData } = await supabase
            .from('retailers')
            .select('*')
            .eq('id', orderData.retailer_id)
            .single()
          
          setRetailer(retailerData)
        }
        
        // Fetch order items with product details
        const { data: itemsData } = await supabase
          .from('order_items')
          .select(`
            id,
            quantity,
            unit_price,
            total_price,
            products (
              id,
              name,
              sku
            )
          `)
          .eq('order_id', params.id)
        
        setOrderItems(itemsData || [])
      } catch (error) {
        console.error('Error fetching order details:', error)
        toast.error('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrderDetails()
  }, [supabase, params.id, manufacturer])
  
  // Handle invoice download
  const downloadInvoice = async () => {
    if (!manufacturer?.id || !order) {
      toast.error("Order information not available")
      return
    }

    try {
      setDownloadingInvoice(true)
      const response = await fetch(`/api/invoices/${order.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId: order.id,
          manufacturerId: manufacturer.id 
        }),
      })
      
      if (response.ok) {
        // Create a URL for the blob
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        // Create a link and trigger download
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${order.order_number || order.id}.txt`
        document.body.appendChild(a)
        a.click()
        
        // Clean up
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success("Invoice downloaded successfully")
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        toast.error(errorData.error || "Failed to download invoice")
      }
    } catch (error) {
      console.error("Error downloading invoice:", error)
      toast.error("Failed to download invoice")
    } finally {
      setDownloadingInvoice(false)
    }
  }
  
  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }
  
  if (!order) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Order Not Found</h1>
          <p className="mt-2 text-muted-foreground">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/orders')}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/orders')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold ml-4">
            Order #{order.order_number || order.id}
            <StatusBadge status={order.processing_status} />
          </h1>
        </div>
        
        <Button
          variant="default"
          onClick={downloadInvoice}
          disabled={downloadingInvoice}
        >
          <FileText className="mr-2 h-5 w-5" />
          {downloadingInvoice ? "Generating Invoice..." : "Download Invoice"}
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>Products included in this order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderItems.length > 0 ? (
                    orderItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.products?.name || 'Unknown Product'}<br />
                          <span className="text-xs text-gray-500">{item.products?.sku || 'No SKU'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${item.unit_price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${item.total_price.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No items found</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right text-sm font-medium">Subtotal:</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">${order.total_amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right text-sm font-medium">Tax (10%):</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">${(order.total_amount * 0.1)?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan="3" className="px-6 py-4 text-right text-sm font-bold">Total:</td>
                    <td className="px-6 py-4 text-right text-sm font-bold">${(order.total_amount * 1.1)?.toFixed(2) || '0.00'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
                <p>{order.created_at ? format(new Date(order.created_at), 'PPP') : 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email Received</h3>
                <p>{order.email_received_at ? format(new Date(order.email_received_at), 'PPP p') : 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email Subject</h3>
                <p className="text-sm">{order.email_subject || 'N/A'}</p>
              </div>
              
              <Separator />
              
              {order.has_special_request && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Special Request</h3>
                  <Badge variant={order.special_request_status === 'resolved' ? 'success' : 'outline'} className="mb-2">
                    {order.special_request_status || 'Pending'}
                  </Badge>
                  <p className="text-sm">{order.special_request_details || 'No details provided'}</p>
                  
                  {order.special_request_status === 'resolved' && (
                    <div className="mt-2">
                      <h3 className="text-sm font-medium text-gray-500">Resolution</h3>
                      <p className="text-sm">{order.special_request_resolution || 'No resolution details'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.special_request_resolved_at && 
                          `Resolved on ${format(new Date(order.special_request_resolved_at), 'PPP')}`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {retailer && (
            <Card>
              <CardHeader>
                <CardTitle>Retailer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Business Name</h3>
                  <p>{retailer.business_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
                  <p>{retailer.contact_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p>{retailer.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p>{retailer.phone || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="text-sm">{retailer.address}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 