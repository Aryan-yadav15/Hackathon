'use client'

import { useState } from "react"
import { useSupabase } from "@/lib/supabase"
import { useManufacturer } from "@/hooks/useManufacturer"
import { motion } from "framer-motion"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EyeIcon, BellAlertIcon } from "@heroicons/react/24/outline"
import TicketModal from "./TicketModal"

export default function TicketsCard({ tickets = [], onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [activeTicket, setActiveTicket] = useState(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const supabase = useSupabase()
  const { manufacturer } = useManufacturer()

  const handleOpenTicket = (ticket) => {
    setActiveTicket(ticket)
    setShowTicketModal(true)
  }

  const handleCloseTicket = () => {
    setShowTicketModal(false)
    setActiveTicket(null)
    if (onRefresh) onRefresh()
  }

  if (loading) {
    return (
      <Card className="shadow-md border-0 overflow-hidden h-full">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b pb-3">
          <CardTitle className="text-orange-900">Special Requests</CardTitle>
          <CardDescription>Loading tickets...</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-48">
            <div className="animate-pulse">Loading tickets...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-md border-0 overflow-hidden h-full">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-orange-900">Special Requests</CardTitle>
              <CardDescription>Orders requiring your attention</CardDescription>
            </div>
            
            {tickets.length > 0 && (
              <Badge className="bg-orange-500">
                {tickets.length} pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 h-48 text-center">
              <BellAlertIcon className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No special requests pending</p>
            </div>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto custom-scrollbar">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Order #{ticket.order_number || ticket.id}</h3>
                      <p className="text-sm text-gray-500">
                        From: {ticket.retailer?.business_name || 'Unknown'}
                      </p>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                      
                      {/* Simple special request badge */}
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                          Special Request
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenTicket(ticket)}
                      className="flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                  
                  {/* Preview of special request */}
                  {ticket.special_request_details && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded max-h-12 overflow-hidden relative">
                      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 to-transparent"></div>
                      {ticket.special_request_details}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TicketModal 
        isOpen={showTicketModal} 
        onClose={handleCloseTicket} 
        ticket={activeTicket}
        refreshTickets={onRefresh}
      />
    </>
  )
} 