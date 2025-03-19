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
import { EyeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import ValidationErrorModal from "./ValidationErrorModal"

export default function ValidationErrorsCard({ orders = [], onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [activeOrder, setActiveOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const supabase = useSupabase()
  const { manufacturer } = useManufacturer()

  const handleOpenOrder = (order) => {
    setActiveOrder(order)
    setShowModal(true)
  }

  const handleCloseOrder = () => {
    setShowModal(false)
    setActiveOrder(null)
    if (onRefresh) onRefresh()
  }

  if (loading) {
    return (
      <Card className="shadow-md border-0 overflow-hidden h-full">
        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b pb-3">
          <CardTitle className="text-red-900">Validation Errors</CardTitle>
          <CardDescription>Loading orders...</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-48">
            <div className="animate-pulse">Loading orders...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-md border-0 overflow-hidden h-full">
        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-red-900">Validation Errors</CardTitle>
              <CardDescription>Orders with parsing or validation issues</CardDescription>
            </div>
            
            {orders.length > 0 && (
              <Badge className="bg-red-500">
                {orders.length} pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 h-48 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No validation errors pending</p>
            </div>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto custom-scrollbar">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Order #{order.order_number || order.id}</h3>
                      <p className="text-sm text-gray-500">
                        From: {order.retailer?.business_name || 'Unknown'}
                      </p>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      
                      {/* Validation error badge */}
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          Validation Error
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenOrder(order)}
                      className="flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                  
                  {/* Preview of validation error */}
                  {(order.validation_errors?.reason || order.email_parsed_data?.orderDetails?.products?.reason) && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded max-h-12 overflow-hidden relative">
                      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 to-transparent"></div>
                      {order.validation_errors?.reason || order.email_parsed_data?.orderDetails?.products?.reason}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ValidationErrorModal 
        isOpen={showModal} 
        onClose={handleCloseOrder} 
        order={activeOrder}
        refreshOrders={onRefresh}
      />
    </>
  )
} 