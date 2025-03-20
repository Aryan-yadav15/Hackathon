'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckIcon, XMarkIcon, ClockIcon, EnvelopeIcon } from "@heroicons/react/24/outline"
import { Textarea } from "@/components/ui/textarea"
import { useSupabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TicketModal({ isOpen, onClose, ticket, refreshTickets }) {
  const [processing, setProcessing] = useState(false)
  const [resolution, setResolution] = useState("")
  const [products, setProducts] = useState({})
  const supabase = useSupabase()

  useEffect(() => {
    if (ticket && ticket.items) {
      const fetchProducts = async () => {
        const productIds = ticket.items
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
  }, [ticket, supabase])

  useEffect(() => {
    // Reset resolution when ticket changes
    setResolution("")
  }, [ticket])

  if (!ticket) return null

  const handleResolveTicket = async (status) => {
    setProcessing(true)

    try {
      // Update the order with the resolution status
      const { error } = await supabase
        .from('orders')
        .update({
          special_request_status: status,
          special_request_resolution: resolution,
          special_request_resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id)
        .select()

      if (error) throw error

      toast.success(`Ticket ${status === 'approved' ? 'approved' : 'declined'} successfully`)
      if (refreshTickets) refreshTickets()
      onClose()
    } catch (error) {
      console.error('Error resolving ticket:', error)
      toast.error('Failed to update ticket status')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Special Request Ticket</DialogTitle>
            <Badge 
              variant="outline" 
              className="bg-yellow-100 text-yellow-800 border-yellow-200"
            >
              <ClockIcon className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </div>
          <DialogDescription>
            Order #{ticket.order_number} from {ticket.retailer?.business_name || 'Unknown'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="details">Order Details</TabsTrigger>
            <TabsTrigger value="email">
              Email
              <EnvelopeIcon className="h-3 w-3 ml-1" />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Special Request Details</h3>
              <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  {ticket.special_request_details || "This order has been flagged as containing a special request that requires review."}
                </p>
                {ticket.special_request_confidence && (
                  <p className="text-xs text-amber-600 mt-1">
                    Confidence: {(ticket.special_request_confidence * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>

            {(ticket.parser_flag === 1 || ticket.validation_errors) && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Validation Errors</h3>
                <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800 font-medium">
                    {ticket.validation_errors?.reason || 
                     ticket.email_parsed_data?.orderDetails?.products?.reason || 
                     "There was an error validating the order, but details were not provided."}
                  </p>
                  
                  {ticket.parser_flag === 1 && (
                    <div className="mt-2 text-xs text-red-700">
                      <p>This order requires manual verification due to parsing issues.</p>
                      <p className="mt-1">Please check the email content for accurate quantities and products before approving.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500">Order Items</h3>
              <div className="max-h-60 overflow-y-auto rounded-lg mt-2 border">
                {ticket.items && ticket.items.map((item, index) => (
                  <div 
                    key={`${item.product_id}-${index}-${ticket.id}`}
                    className="flex justify-between py-2 px-3 border-b"
                  >
                    <div>
                      {item.product_name || products[item.product_id]?.name || `Product #${item.product_id || 'Unknown'}`}
                    </div>
                    <div className="font-medium">Qty: {item.quantity}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm"><span className="font-medium">Business:</span> {ticket.retailer?.business_name || 'Unknown'}</p>
                <p className="text-sm"><span className="font-medium">Contact:</span> {ticket.retailer?.contact_name || 'Unknown'}</p>
                <p className="text-sm"><span className="font-medium">Email:</span> {ticket.retailer?.email || 'Unknown'}</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500">Subject:</div>
                <div className="text-sm">{ticket.email_subject || 'No subject'}</div>
              </div>
              
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500">From:</div>
                <div className="text-sm">{ticket.retailer?.email || 'Unknown'}</div>
              </div>
              
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500">Email Body:</div>
                <div className="bg-white p-3 rounded border mt-1 max-h-60 overflow-y-auto whitespace-pre-wrap text-sm">
                  {ticket.email_body || 
                   ticket.email_content || 
                   (ticket.email_parsed_data && (
                     ticket.email_parsed_data.emailContent ||
                     ticket.email_parsed_data.rawEmail || 
                     ticket.email_parsed_data.emailBody ||
                     ticket.email_parsed_data.body ||
                     ticket.email_parsed_data.content ||
                     (ticket.email_parsed_data.orderDetails && ticket.email_parsed_data.orderDetails.emailBody) ||
                     (ticket.email_parsed_data.orderDetails && ticket.email_parsed_data.orderDetails.body) ||
                     (typeof ticket.email_parsed_data === 'string' ? 
                       ticket.email_parsed_data : 
                       JSON.stringify(ticket.email_parsed_data, null, 2))
                   )) || 
                   'No email body'}
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
            onClick={() => handleResolveTicket('declined')}
            disabled={processing}
            className="flex-1"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Decline
          </Button>
          <Button
            variant="default"
            onClick={() => handleResolveTicket('approved')}
            disabled={processing}
            className="flex-1"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 