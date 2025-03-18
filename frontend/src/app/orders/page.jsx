'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase'
import { useManufacturer } from '@/hooks/useManufacturer'
import { OrdersTable } from '@/components/orders/OrdersTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CheckIcon, SearchIcon, FileText, RefreshCcw } from 'lucide-react'
import { toast } from "sonner"

export default function OrdersPage() {
  const supabase = useSupabase()
  const { manufacturer } = useManufacturer()
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [downloadingBulk, setDownloadingBulk] = useState(false)
  
  // Fetch orders based on filters
  const fetchOrders = async () => {
    if (!manufacturer?.id) return;
    
    setLoading(true);
    
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          updated_at,
          total_amount,
          processing_status,
          has_special_request,
          special_request_status,
          validation_errors,
          retailers (
            id,
            business_name,
            contact_name,
            email
          )
        `)
        .eq('manufacturer_id', manufacturer.id)
        .order('created_at', { ascending: false });
      
      // Apply status filter if selected
      if (statusFilter !== 'all') {
        query = query.eq('processing_status', statusFilter);
      }
      
      // Apply search filter if provided
      if (searchQuery) {
        query = query.or(`order_number.ilike.%${searchQuery}%,retailers.business_name.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (manufacturer?.id) {
      fetchOrders();
    }
  }, [manufacturer?.id, searchQuery, statusFilter]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };
  
  const handleBulkDownload = async () => {
    if (!manufacturer?.id) {
      toast.error('User information not available');
      return;
    }
    
    try {
      setDownloadingBulk(true);
      
      // Implement bulk download functionality here
      
      toast.success('Bulk download started');
    } catch (error) {
      console.error('Error with bulk download:', error);
      toast.error('Failed to start bulk download');
    } finally {
      setDownloadingBulk(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBulkDownload}
            disabled={downloadingBulk || orders.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            {downloadingBulk ? 'Processing...' : 'Bulk Export'}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search orders..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <OrdersTable 
        data={orders} 
        isLoading={loading} 
        onRefresh={handleRefresh}
      />
    </div>
  )
} 