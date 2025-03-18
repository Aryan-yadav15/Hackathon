"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase";
import { useManufacturer } from "@/hooks/useManufacturer";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CalendarIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import TicketsCard from "@/components/dashboard/TicketsCard";

export default function DashboardPage() {
  const { user } = useUser();
  const supabase = useSupabase();
  const { manufacturer } = useManufacturer();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState("week");
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    orderCount: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    topProducts: [],
    revenueGrowth: 0,
    orderGrowth: 0,
    aovGrowth: 0,
    pendingGrowth: 0,
  });
  const [tickets, setTickets] = useState([]);

  // Enhanced color palette
  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];
  const GRADIENTS = [
    ["#3b82f6", "#2563eb"], // blue
    ["#10b981", "#059669"], // green
    ["#f59e0b", "#d97706"], // yellow
    ["#ef4444", "#dc2626"], // red
    ["#8b5cf6", "#7c3aed"], // purple
    ["#ec4899", "#db2777"], // pink
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!manufacturer?.id) return;

      setLoading(true);
      try {
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(
            `
            *,
            retailer:retailers(business_name, email),
            items:order_items(*)
          `
          )
          .eq("manufacturer_id", manufacturer.id)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("manufacturer_id", manufacturer.id);

        if (productsError) throw productsError;

        setOrders(ordersData || []);
        setProducts(productsData || []);

        // Calculate metrics with synthetic growth rates
        calculateMetrics(ordersData || [], productsData || []);

        // Fetch tickets
        await fetchTickets();
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    if (manufacturer?.id) {
      fetchData();
    }
  }, [manufacturer?.id, supabase, refreshing]);

  // Recalculate metrics when timeframe changes
  useEffect(() => {
    if (orders.length > 0 && products.length > 0) {
      calculateMetrics(orders, products);
    }
  }, [timeframe, orders, products]);

  const refreshData = () => {
    setRefreshing(true);
  };

  const calculateMetrics = (orders, products) => {
    // Filter orders by timeframe
    const now = new Date();
    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      if (timeframe === "week") {
        return now - orderDate < 7 * 24 * 60 * 60 * 1000;
      } else if (timeframe === "month") {
        return now - orderDate < 30 * 24 * 60 * 60 * 1000;
      } else if (timeframe === "quarter") {
        return now - orderDate < 90 * 24 * 60 * 60 * 1000;
      } else {
        return true; // all time
      }
    });

    // Get previous period for comparison
    const previousPeriodOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      if (timeframe === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return (
          orderDate < weekAgo &&
          orderDate >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000)
        );
      } else if (timeframe === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return (
          orderDate < monthAgo &&
          orderDate >= new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000)
        );
      } else if (timeframe === "quarter") {
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return (
          orderDate < quarterAgo &&
          orderDate >= new Date(quarterAgo.getTime() - 90 * 24 * 60 * 60 * 1000)
        );
      } else {
        // For "all time", compare to previous half of the date range
        const oldestDate = orders.length
          ? new Date(
              Math.min(...orders.map((o) => new Date(o.created_at).getTime()))
            )
          : now;
        const halfwayPoint = new Date(
          (now.getTime() + oldestDate.getTime()) / 2
        );
        return orderDate < halfwayPoint;
      }
    });

    // Calculate order count
    const orderCount = filteredOrders.length;
    const prevOrderCount = previousPeriodOrders.length;

    // Calculate status counts
    const pendingOrders = filteredOrders.filter(
      (order) => order.processing_status === "pending"
    ).length;
    const prevPendingOrders = previousPeriodOrders.filter(
      (order) => order.processing_status === "pending"
    ).length;

    const completedOrders = filteredOrders.filter(
      (order) => order.processing_status === "completed"
    ).length;

    // Calculate total revenue
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      // Use item quantities * product prices
      const orderValue = order.items.reduce((total, item) => {
        const product = products.find((p) => p.name === item.product_name);
        return total + (product ? product.price * item.quantity : 0);
      }, 0);
      return sum + orderValue;
    }, 0);

    const prevTotalRevenue = previousPeriodOrders.reduce((sum, order) => {
      const orderValue = order.items.reduce((total, item) => {
        const product = products.find((p) => p.name === item.product_name);
        return total + (product ? product.price * item.quantity : 0);
      }, 0);
      return sum + orderValue;
    }, 0);

    // Calculate average order value
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const prevAverageOrderValue =
      prevOrderCount > 0 ? prevTotalRevenue / prevOrderCount : 0;

    // Calculate growth rates
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const revenueGrowth = calculateGrowth(totalRevenue, prevTotalRevenue);
    const orderGrowth = calculateGrowth(orderCount, prevOrderCount);
    const aovGrowth = calculateGrowth(averageOrderValue, prevAverageOrderValue);
    const pendingGrowth = calculateGrowth(pendingOrders, prevPendingOrders);

    // Calculate top products
    const productCounts = {};
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (productCounts[item.product_name]) {
          productCounts[item.product_name] += item.quantity;
        } else {
          productCounts[item.product_name] = item.quantity;
        }
      });
    });

    const topProducts = Object.entries(productCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setMetrics({
      totalRevenue,
      orderCount,
      averageOrderValue,
      pendingOrders,
      completedOrders,
      topProducts,
      revenueGrowth,
      orderGrowth,
      aovGrowth,
      pendingGrowth,
    });
  };

  // Generate chart data for orders over time
  const getOrderTimeData = () => {
    const dateMap = {};

    // Group orders by date
    orders.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString();
      if (dateMap[date]) {
        dateMap[date]++;
      } else {
        dateMap[date] = 1;
      }
    });

    // Convert to array for chart
    return Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-10); // Last 10 days
  };

  // Generate data for order status distribution
  const getOrderStatusData = () => {
    const statusCounts = {
      pending: metrics.pendingOrders,
      completed: metrics.completedOrders,
      cancelled: orders.filter((o) => o.processing_status === "cancelled")
        .length,
      processing: orders.filter((o) => o.processing_status === "processing")
        .length,
    };

    return Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0); // Only include non-zero values
  };

  // Get revenue data with product breakdown
  const getRevenueData = () => {
    const productRevenue = {};

    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      const now = new Date();
      if (timeframe === "week") {
        return now - orderDate < 7 * 24 * 60 * 60 * 1000;
      } else if (timeframe === "month") {
        return now - orderDate < 30 * 24 * 60 * 60 * 1000;
      } else if (timeframe === "quarter") {
        return now - orderDate < 90 * 24 * 60 * 60 * 1000;
      } else {
        return true;
      }
    });

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((p) => p.name === item.product_name);
        if (product) {
          const revenue = product.price * item.quantity;
          if (productRevenue[item.product_name]) {
            productRevenue[item.product_name] += revenue;
          } else {
            productRevenue[item.product_name] = revenue;
          }
        }
      });
    });

    return Object.entries(productRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 by revenue
  };

  const getCompletionRate = () => {
    const total = metrics.orderCount;
    if (total === 0) return 0;
    return Math.round((metrics.completedOrders / total) * 100);
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "quarter":
        return "This Quarter";
      default:
        return "All Time";
    }
  };

  const fetchTickets = async () => {
    try {
      if (!manufacturer?.id) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          email_subject,
          items:order_items(product_id, quantity),
          retailer:retailers(business_name, contact_name, email),
          special_request_details,
          special_request_confidence,
          created_at
        `)
        .eq('has_special_request', true)
        .eq('special_request_status', 'pending')
        .eq('manufacturer_id', manufacturer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', {
        message: error.message,
        details: error.details,
        code: error.code
      });
      setTickets([]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-lg font-medium mb-4">
          Loading dashboard data...
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <ArrowPathIcon className="h-10 w-10 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-12">
      {/* Header section with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg mb-8">
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-blue-100">
                Welcome back, {user?.firstName || "there"}! Here's your business
                at a glance.
              </p>
            </div>
            <div>
              {tickets.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-3 py-1 rounded-full bg-red-500 text-white flex items-center ml-2"
                >
                  <BellAlertIcon className="h-4 w-4 mr-1" />
                  <span>{tickets.length}</span>
                </motion.div>
              )}
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={refreshData}
              >
                <ArrowPathIcon
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh Data
              </Button>
              <div className="flex items-center bg-white/10 rounded-full px-3 py-1">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span className="text-sm ">{getTimeframeLabel()}</span>
              </div>
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="mt-6">
            <Tabs
              defaultValue="week"
              onValueChange={setTimeframe}
              className="bg-white/10 inline-block rounded-lg p-1"
            >
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="week"
                  className="data-[state=active]:bg-white/20 text-gray-300 data-[state=active]:text-white"
                >
                  This Week
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  className="data-[state=active]:bg-white/20 text-gray-300 data-[state=active]:text-white"
                >
                  This Month
                </TabsTrigger>
                <TabsTrigger
                  value="quarter"
                  className="data-[state=active]:bg-white/20 text-gray-300 data-[state=active]:text-white"
                >
                  This Quarter
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-white/20 text-gray-300 data-[state=active]:text-white"
                >
                  All Time
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <MetricCard
              title="Total Revenue"
              value={`$${metrics.totalRevenue.toFixed(2)}`}
              icon={<CurrencyDollarIcon className="h-8 w-8 text-white" />}
              change={metrics.revenueGrowth.toFixed(1)}
              iconBg="from-green-400 to-green-600"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <MetricCard
              title="Orders"
              value={metrics.orderCount}
              icon={<ShoppingCartIcon className="h-8 w-8 text-white" />}
              change={metrics.orderGrowth.toFixed(1)}
              iconBg="from-blue-400 to-blue-600"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <MetricCard
              title="Average Order Value"
              value={`$${metrics.averageOrderValue.toFixed(2)}`}
              icon={<ChartBarIcon className="h-8 w-8 text-white" />}
              change={metrics.aovGrowth.toFixed(1)}
              iconBg="from-purple-400 to-purple-600"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <MetricCard
              title="Pending Orders"
              value={metrics.pendingOrders}
              icon={<UsersIcon className="h-8 w-8 text-white" />}
              change={metrics.pendingGrowth.toFixed(1)}
              iconBg="from-amber-400 to-amber-600"
            />
          </motion.div>
        </div>

        {/* Priority Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tickets Section - Takes 1/3 of the width on large screens */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold">Special Requests</h2>
                  {tickets.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-3 px-2 py-1 rounded-full bg-red-500 text-white text-sm flex items-center"
                    >
                      <BellAlertIcon className="h-4 w-4 mr-1" />
                      <span>{tickets.length}</span>
                    </motion.div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchTickets}
                  className="text-xs"
                >
                  <ArrowPathIcon className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="h-[calc(100vh-260px)] max-h-[600px]"
              >
                <TicketsCard tickets={tickets} onRefresh={fetchTickets} />
              </motion.div>
            </div>
          </div>

          {/* Main Charts - Takes 2/3 of the width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Orders Over Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="shadow-md border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b pb-3">
                  <CardTitle className="text-blue-900">Orders Over Time</CardTitle>
                  <CardDescription>Tracking order volume trends</CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={getOrderTimeData()}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b' }} />
                        <YAxis tick={{ fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#colorOrders)" 
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Status Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="shadow-md border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b pb-3">
                  <CardTitle className="text-purple-900">Status Distribution</CardTitle>
                  <CardDescription>Order status breakdown</CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getOrderStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          innerRadius={50}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {getOrderStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Secondary Insight Rows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="shadow-md border-0 overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b pb-3">
                <CardTitle className="text-amber-900">Top Products</CardTitle>
                <CardDescription>Best selling products by quantity</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.topProducts}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#f59e0b" name="Quantity Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="shadow-md border-0 overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b pb-3">
                <CardTitle className="text-emerald-900">Recent Activity</CardTitle>
                <CardDescription>Latest orders received</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[400px] overflow-auto custom-scrollbar">
                  {orders.slice(0, 5).map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className="p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Order #{order.order_number}</div>
                          <div className="text-sm text-gray-500">
                            From: {order.retailer?.business_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.processing_status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.processing_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.processing_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.processing_status}
                          </span>
                          {order.has_special_request && (
                            <span className="ml-2 px-2 py-1 rounded-full bg-orange-100 text-orange-800 text-xs">
                              Special
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Completion Rate */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="shadow-md border-0 overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b pb-3">
                <CardTitle className="text-sky-900">Completion Rate</CardTitle>
                <CardDescription>
                  Percentage of completed orders
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-8 pb-8">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      barSize={10}
                      data={[
                        {
                          name: "Completion Rate",
                          value: getCompletionRate(),
                          fill: "#3b82f6",
                        },
                      ]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={30}
                        fill="#3b82f6"
                      />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-bold text-3xl"
                        fill="#3b82f6"
                      >
                        {getCompletionRate()}%
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <div className="text-sm text-gray-500">
                    {metrics.completedOrders} out of {metrics.orderCount} orders
                    completed
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Revenue Contributors */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="md:col-span-2"
          >
            <Card className="shadow-md border-0 overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b pb-3">
                <CardTitle className="text-emerald-900">
                  Revenue by Product
                </CardTitle>
                <CardDescription>
                  Products contributing most to your revenue
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getRevenueData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b" }} />
                      <YAxis
                        tickFormatter={(value) => `$${value}`}
                        tick={{ fill: "#64748b" }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `$${value.toFixed(2)}`,
                          "Revenue",
                        ]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                          border: "none",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Revenue" radius={[4, 4, 0, 0]}>
                        {getRevenueData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#gradientBar${index})`}
                          />
                        ))}
                        {/* Create gradient definitions */}
                        {GRADIENTS.map((colors, index) => (
                          <defs key={`gradient-${index}`}>
                            <linearGradient
                              id={`gradientBar${index}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={colors[0]}
                                stopOpacity={1}
                              />
                              <stop
                                offset="100%"
                                stopColor={colors[1]}
                                stopOpacity={1}
                              />
                            </linearGradient>
                          </defs>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Enhanced metric card component
function MetricCard({ title, value, icon, change, iconBg }) {
  const isPositive = parseFloat(change) >= 0;

  return (
    <Card className="shadow-md border-0 overflow-hidden h-full">
      <CardContent className="pt-6 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div
            className={`p-3 rounded-full bg-gradient-to-br ${iconBg} shadow-lg`}
          >
            {icon}
          </div>
        </div>

        <div className="mt-6 flex items-center">
          <span
            className={`text-sm font-medium flex items-center space-x-1 ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
            <span>{Math.abs(parseFloat(change))}%</span>
          </span>
          <span className="text-sm text-gray-500 ml-2">vs previous period</span>
        </div>
      </CardContent>
    </Card>
  );
}
