'use client'

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase"

export default function OrdersPage() {
  const { user } = useUser()
  const [orders, setOrders] = useState([])
  const supabase = useSupabase()

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          retailer:retailers(business_name, email),
          items:order_items(*)
        `)
        .eq('manufacturer_id', user.id)
        .order('created_at', { ascending: false })

      if (!error) {
        setOrders(data)
      }
    }

    if (user) {
      fetchOrders()
    }
  }, [user])

  return (
    <div>
      <h1>Orders</h1>
      {/* Order list UI */}
    </div>
  )
} 