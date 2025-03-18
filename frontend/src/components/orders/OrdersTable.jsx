import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, FileText, Eye, DownloadCloud, Download, CheckCircle, RefreshCw, XCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useManufacturer } from "@/hooks/useManufacturer"
import { useSupabase } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function OrdersTable({ data = [], isLoading, onRefresh }) {
  const router = useRouter()
  const { manufacturer } = useManufacturer()
  const supabase = useSupabase()
  const [downloadingId, setDownloadingId] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(null)

  const viewOrderDetails = (orderId) => {
    router.push(`/orders/${orderId}`)
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!manufacturer?.id) {
      toast.error("User information not available")
      return
    }

    try {
      setUpdatingStatus(orderId)
      
      console.log(`Updating order ${orderId} to status: ${newStatus}`)
      
      // Create the update payload
      const updatePayload = { 
        processing_status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      console.log("Update payload:", updatePayload)
      
      // Update order status in database
      const { data, error, status, statusText } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId)
        .select()
      
      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      console.log(`Order ${orderId} updated successfully:`, data)
      toast.success(`Order status updated to ${newStatus}`)
      
      // Refresh data if callback provided
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      
      // More detailed error messaging based on error type
      let errorMessage = "Failed to update order status"
      
      if (error?.code === "23505") {
        errorMessage = "This status update conflicts with existing data"
      } else if (error?.code === "42501") {
        errorMessage = "You don't have permission to update this order"
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      toast.error(errorMessage)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDownloadInvoice = async (order) => {
    if (!manufacturer?.id) {
      toast.error("User information not available")
      return
    }

    try {
      setDownloadingId(order.id)
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
        // Create a URL for the blob (PDF blob now)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        // Create a link and trigger download (filename will be .pdf now)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${order.order_number || order.id}.pdf` // Download as PDF
        document.body.appendChild(a)
        a.click()
        
        // Clean up
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success("Invoice downloaded successfully")
      } else {
        try {
          const errorData = await response.json()
          console.error("Error response:", errorData)
          toast.error(errorData.error || "Failed to download invoice")
        } catch (jsonError) {
          // Handle cases where response is not JSON (e.g., HTML error page)
          console.error("Non-JSON error response:", response.statusText)
          toast.error("Failed to download invoice. Server error.")
        }
      }
    } catch (error) {
      console.error("Error downloading invoice:", error)
      toast.error("Failed to download invoice")
    } finally {
      setDownloadingId(null)
    }
  }

  // Helper function to get status badge variant and UI elements
  const getStatusDetails = (status) => {
    switch(status) {
      case 'pending':
        return { 
          label: 'Pending', 
          variant: 'outline',
          icon: <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          hoverBg: 'hover:bg-amber-100',
          iconColor: 'text-amber-500'
        }
      case 'processing':
        return { 
          label: 'Processing', 
          variant: 'default',
          icon: <RefreshCw className="h-3.5 w-3.5 mr-1.5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          hoverBg: 'hover:bg-blue-100',
          iconColor: 'text-blue-500'
        }
      case 'complete':
        return { 
          label: 'Completed', 
          variant: 'success',
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1.5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          hoverBg: 'hover:bg-green-100',
          iconColor: 'text-green-500'
        }
      case 'canceled':
        return { 
          label: 'Cancelled', 
          variant: 'destructive',
          icon: <XCircle className="h-3.5 w-3.5 mr-1.5" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          hoverBg: 'hover:bg-red-100',
          iconColor: 'text-red-500'
        }
      case 'validated':
        return { 
          label: 'Validated', 
          variant: 'success',
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1.5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          hoverBg: 'hover:bg-green-100',
          iconColor: 'text-green-500'
        }
      case 'invalid':
        return { 
          label: 'Invalid', 
          variant: 'destructive',
          icon: <XCircle className="h-3.5 w-3.5 mr-1.5" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          hoverBg: 'hover:bg-red-100',
          iconColor: 'text-red-500'
        }
      case 'error':
        return { 
          label: 'Error', 
          variant: 'destructive',
          icon: <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          hoverBg: 'hover:bg-red-100',
          iconColor: 'text-red-500'
        }
      default:
        return { 
          label: status || 'Unknown', 
          variant: 'outline',
          icon: null,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          hoverBg: 'hover:bg-gray-100',
          iconColor: 'text-gray-400'
        }
    }
  }

  // Create columns for the data table
  const columns = [
    {
      id: "order_number",
      header: "Order #",
      cell: ({ row }) => {
        const order = row.original
        return <div className="font-medium">{order.order_number || `#${order.id}`}</div>
      },
    },
    {
      id: "retailer",
      header: "Retailer",
      cell: ({ row }) => {
        const order = row.original
        return (
          <div>
            <div className="font-medium">{order.retailers?.business_name || 'Unknown'}</div>
            <div className="text-sm text-muted-foreground">{order.retailers?.contact_name}</div>
          </div>
        )
      },
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => {
        const order = row.original
        return order.created_at ? format(new Date(order.created_at), 'MMM d, yyyy') : 'N/A'
      },
    },
    {
      id: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const order = row.original
        return <div className="font-medium">${order.total_amount?.toFixed(2) || '0.00'}</div>
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const order = row.original
        const statusDetails = getStatusDetails(order.processing_status)
        
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 px-2 py-1 flex items-center justify-start hover:bg-transparent rounded-md"
                disabled={updatingStatus === order.id}
              >
                <div className="flex items-center border rounded-md px-2 py-1 bg-white">
                  {statusDetails.icon && (
                    <span className={statusDetails.iconColor}>{statusDetails.icon}</span>
                  )}
                  <span className="text-sm">{statusDetails.label}</span>
                  {updatingStatus === order.id && (
                    <RefreshCw className="h-3 w-3 ml-2 animate-spin" />
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1 shadow-lg border border-gray-200">
              <div className="py-1">
                <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-100 mb-1">
                  Update Status
                </div>
                {['pending', 'processing', 'validated', 'invalid', 'error'].map((status) => {
                  const details = getStatusDetails(status)
                  const isActive = order.processing_status === status;
                  
                  return (
                    <div
                      key={status}
                      className={`px-3 py-2 flex items-center text-sm cursor-pointer ${details.bgColor} ${isActive ? 'font-medium' : 'hover:bg-opacity-80'} transition-colors`}
                      onClick={() => !isActive && handleUpdateStatus(order.id, status)}
                    >
                      <span className={details.iconColor}>{details.icon}</span>
                      <span className={details.color}>{details.label}</span>
                    </div>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        )
      },
    },
    {
      id: "download",
      header: "Invoice",
      cell: ({ row }) => {
        const order = row.original
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadInvoice(order)}
            disabled={downloadingId === order.id}
            className="flex items-center gap-1"
          >
            {downloadingId === order.id ? (
              <>
                <DownloadCloud className="h-4 w-4 animate-pulse" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download</span>
              </>
            )}
          </Button>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => viewOrderDetails(order.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDownloadInvoice(order)}
                  disabled={downloadingId === order.id}
                >
                  {downloadingId === order.id ? (
                    <>
                      <DownloadCloud className="mr-2 h-4 w-4 animate-pulse" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Download Invoice
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="w-full border rounded-lg p-8 flex flex-col items-center justify-center text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Orders Found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          There are no orders matching your criteria.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.id === 'actions' ? 'text-right' : undefined}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((order) => (
            <TableRow key={order.id}>
              {columns.map((column) => (
                <TableCell key={`${order.id}-${column.id}`}>
                  {column.cell({ row: { original: order } })}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}