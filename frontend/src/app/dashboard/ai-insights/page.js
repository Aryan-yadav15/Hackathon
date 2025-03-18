"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase";
import { useManufacturer } from "@/hooks/useManufacturer";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  CpuChipIcon, SparklesIcon, CalendarIcon, ChartPieIcon,
  UserGroupIcon, ShoppingBagIcon, BoltIcon
} from "@heroicons/react/24/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIInsightsPage() {
  const supabase = useSupabase();
  const { manufacturer } = useManufacturer();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [orders, setOrders] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [products, setProducts] = useState([]);
  const [insights, setInsights] = useState({});
  const [timeframe, setTimeframe] = useState("last30days");
  const [insightType, setInsightType] = useState("sales");

  // Enhanced color palette
  const COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!manufacturer?.id) return;

      setLoading(true);
      try {
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(`
            *,
            retailer:retailers(id, business_name, email),
            items:order_items(*)
          `)
          .eq("manufacturer_id", manufacturer.id)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        // Fetch retailers
        const { data: retailersData, error: retailersError } = await supabase
          .from("retailers")
          .select("*")
          .eq("manufacturer_id", manufacturer.id);

        if (retailersError) throw retailersError;

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("manufacturer_id", manufacturer.id);

        if (productsError) throw productsError;

        setOrders(ordersData || []);
        setRetailers(retailersData || []);
        setProducts(productsData || []);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (manufacturer?.id) {
      fetchData();
    }
  }, [manufacturer?.id, supabase]);

  useEffect(() => {
    if (orders.length > 0 && retailers.length > 0 && products.length > 0) {
      generateInsights(orders, retailers, products);
    }
  }, [orders, retailers, products, timeframe]);

  const generateInsights = async (orders, retailers, products) => {
    setGenerating(true);

    // Filter orders by timeframe
    const now = new Date();
    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      if (timeframe === "last7days") {
        return now - orderDate < 7 * 24 * 60 * 60 * 1000;
      } else if (timeframe === "last30days") {
        return now - orderDate < 30 * 24 * 60 * 60 * 1000;
      } else if (timeframe === "last90days") {
        return now - orderDate < 90 * 24 * 60 * 60 * 1000;
      } else if (timeframe === "lastYear") {
        return now - orderDate < 365 * 24 * 60 * 60 * 1000;
      }
      return true; // all time
    });

    // Process data for each tab
    await generateSalesInsights(filteredOrders);
    await generateRetailerInsights(filteredOrders, retailers);
    await generateProductInsights(filteredOrders, products, retailers);
    await generateOperationalInsights(filteredOrders);

    setGenerating(false);
  };

  const generateSalesInsights = async (filteredOrders) => {
    // Aggregate revenue data
    const revenueData = {};
    filteredOrders.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString();
      const orderValue = order.items.reduce(
        (total, item) => total + item.quantity * item.unit_price,
        0
      );
      if (revenueData[date]) {
        revenueData[date] += orderValue;
      } else {
        revenueData[date] = orderValue;
      }
    });

    // Convert to array for chart
    const chartData = Object.entries(revenueData)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Simulate AI prediction
    const predictionData = [...chartData];
    if (chartData.length > 0) {
      const lastDate = new Date(chartData[chartData.length - 1].date);
      const growthRate =
        chartData.length > 1
          ? (chartData[chartData.length - 1].value -
              chartData[chartData.length - 2].value) /
            chartData[chartData.length - 2].value
          : 0;

      for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i);
        const predictedValue =
          chartData[chartData.length - 1].value * (1 + growthRate);
        predictionData.push({
          date: nextDate.toLocaleDateString(),
          value: predictedValue,
          predicted: true,
        });
      }
    }

    // Anomaly detection (simple example)
    const values = chartData.map((item) => item.value);
    const average = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    const standardDeviation = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
        values.length
    );

    const anomalies = chartData.filter((item) => {
      const deviation = ((item.value - average) / average) * 100;
      return (
        Math.abs(item.value - average) > 2 * standardDeviation &&
        Math.abs(deviation) > 10
      ); // More than 2 standard deviations and 10% change
    });

    // Add deviation percentage to anomalies
    anomalies.forEach((item) => {
      item.deviation = (((item.value - average) / average) * 100).toFixed(1);
    });

    setInsights((prev) => ({
      ...prev,
      sales: {
        predictions: predictionData,
        anomalies: anomalies,
      },
    }));
  };

  const generateRetailerInsights = async (filteredOrders, retailers) => {
    // Simulate retailer segmentation (in a real app, you would use ML clustering)
    const segments = {
      "High Value": [],
      "Regular": [],
      "Occasional": [],
      "Inactive": [],
    };

    // Track retailer spending data
    const retailerData = {};
    retailers.forEach(retailer => {
      retailerData[retailer.id] = {
        id: retailer.id,
        name: retailer.business_name,
        totalSpent: 0,
        orderCount: 0,
        lastOrderDate: null,
        averageOrderValue: 0
      };
    });

    // Aggregate retailer order data
    filteredOrders.forEach(order => {
      if (!retailerData[order.retailer_id]) return;
      
      const orderTotal = order.items.reduce(
        (sum, item) => sum + (item.quantity * item.unit_price), 
        0
      );
      
      retailerData[order.retailer_id].totalSpent += orderTotal;
      retailerData[order.retailer_id].orderCount++;
      
      const orderDate = new Date(order.created_at);
      if (!retailerData[order.retailer_id].lastOrderDate || 
          orderDate > retailerData[order.retailer_id].lastOrderDate) {
        retailerData[order.retailer_id].lastOrderDate = orderDate;
      }
    });

    // Calculate averages and segment retailers
    const now = new Date();
    retailers.forEach(retailer => {
      const data = retailerData[retailer.id];
      
      // Calculate average order value
      data.averageOrderValue = data.orderCount > 0 ? 
        data.totalSpent / data.orderCount : 0;
      
      // Segmentation logic
      if (data.orderCount === 0) {
        segments["Inactive"].push(retailer.id);
      } else if (data.totalSpent > 5000) {
        segments["High Value"].push(retailer.id);
      } else if (data.orderCount >= 3) {
        segments["Regular"].push(retailer.id);
      } else {
        segments["Occasional"].push(retailer.id);
      }
    });

    // Churn risk analysis
    const churnRisk = [];
    retailers.forEach(retailer => {
      const data = retailerData[retailer.id];
      
      if (data.lastOrderDate) {
        const daysSinceLastOrder = Math.round((now - data.lastOrderDate) / (1000 * 60 * 60 * 24));
        
        // Example churn risk assessment
        if (daysSinceLastOrder > 60 && data.orderCount > 0) {
          churnRisk.push({
            retailerId: retailer.id,
            retailerName: retailer.business_name,
            daysSinceLastOrder,
            riskLevel: daysSinceLastOrder > 90 ? "High" : "Medium",
            confidence: Math.min(95, Math.round(50 + daysSinceLastOrder / 5)),
          });
        }
      }
    });

    // Sort churn risk by risk level (high to low)
    churnRisk.sort((a, b) => {
      if (a.riskLevel === b.riskLevel) {
        return b.daysSinceLastOrder - a.daysSinceLastOrder;
      }
      return a.riskLevel === "High" ? -1 : 1;
    });

    // Calculate customer lifetime value (simplified version)
    const topRetailers = Object.values(retailerData)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        name: r.name,
        spent: r.totalSpent,
        orders: r.orderCount,
        aov: r.averageOrderValue,
        predictedValue: r.totalSpent * 1.5 // Simplified prediction
      }));

    setInsights(prev => ({
      ...prev,
      retailers: {
        segments,
        segmentData: Object.entries(segments).map(([name, retailers]) => ({
          name,
          value: retailers.length
        })),
        churnRisk,
        topRetailers
      }
    }));
  };

  const generateProductInsights = async (filteredOrders, products, retailers) => {
    // Aggregate product data
    const productData = {};

    // Initialize product data structure
    products.forEach((product) => {
      productData[product.id] = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantitySold: 0,
        revenue: 0,
        orderCount: 0,
        uniqueRetailers: new Set(),
      };
    });

    // Aggregate order data by product
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.product_id;
        if (!productData[productId]) return;

        productData[productId].quantitySold += item.quantity;
        productData[productId].revenue += item.quantity * item.unit_price;
        productData[productId].orderCount++;
        productData[productId].uniqueRetailers.add(order.retailer_id);
      });
    });

    // Calculate derived metrics
    Object.values(productData).forEach((product) => {
      product.avgOrderSize =
        product.orderCount > 0
          ? product.quantitySold / product.orderCount
          : 0;
      product.retailerCount = product.uniqueRetailers.size;
      delete product.uniqueRetailers;
    });

    // Top products by revenue
    const topProducts = Object.values(productData)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Product affinity analysis (which products are often ordered together)
    const productPairs = {};
    filteredOrders.forEach((order) => {
      const items = order.items;

      // For each pair of products in the order
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const pid1 = items[i].product_id;
          const pid2 = items[j].product_id;

          // Create a consistent key for the pair
          const pairKey = pid1 < pid2 ? `${pid1}-${pid2}` : `${pid2}-${pid1}`;

          if (!productPairs[pairKey]) {
            productPairs[pairKey] = {
              product1: productData[pid1]?.name || "Unknown",
              product2: productData[pid2]?.name || "Unknown",
              count: 0,
              strength: 0,
            };
          }

          productPairs[pairKey].count++;
        }
      }
    });

    // Calculate affinity strength
    Object.values(productPairs).forEach((pair) => {
      const p1Frequency =
        productData[products.find((p) => p.name === pair.product1)?.id]
          ?.orderCount || 0;
      const p2Frequency =
        productData[products.find((p) => p.name === pair.product2)?.id]
          ?.orderCount || 0;

      if (p1Frequency > 0 && p2Frequency > 0) {
        // Simple lift calculation
        pair.strength =
          (pair.count * filteredOrders.length) / (p1Frequency * p2Frequency);
      }
    });

    // Top product affinities
    const topAffinities = Object.values(productPairs)
      .filter((pair) => pair.count >= 2) // At least a few occurrences
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5);

    // Product recommendations for retailers
    const recommendations = [];
    retailers.slice(0, 5).forEach((retailer) => {
      const productsBought = new Set();

      // Find products this retailer has already purchased
      filteredOrders
        .filter((order) => order.retailer_id === retailer.id)
        .forEach((order) => {
          order.items.forEach((item) => {
            productsBought.add(item.product_id);
          });
        });

      // Find top products this retailer hasn't bought yet
      const recommendedProducts = topProducts
        .filter((product) => !productsBought.has(product.id))
        .slice(0, 3)
        .map((p) => p.name);

      if (recommendedProducts.length > 0) {
        recommendations.push({
          retailerId: retailer.id,
          retailerName: retailer.business_name,
          products: recommendedProducts,
          confidence: Math.floor(60 + Math.random() * 30), // Random confidence for demo
        });
      }
    });

    setInsights((prev) => ({
      ...prev,
      products: {
        topProducts,
        affinities: topAffinities,
        recommendations,
      },
    }));
  };

  const generateOperationalInsights = async (filteredOrders) => {
    // Process efficiency analysis
    const processingTimes = [];
    const specialRequestData = [];

    filteredOrders.forEach((order) => {
      // Calculate processing time if we have the necessary timestamps
      if (
        order.created_at &&
        order.updated_at &&
        order.processing_status === "completed"
      ) {
        const createDate = new Date(order.created_at);
        const updateDate = new Date(order.updated_at);
        const processingHours = (updateDate - createDate) / (1000 * 60 * 60);

        processingTimes.push({
          id: order.id,
          orderNumber: order.order_number,
          hours: processingHours,
          hasSpecialRequest: order.has_special_request,
        });
      }

      // Special request data
      if (order.has_special_request) {
        specialRequestData.push({
          id: order.id,
          orderNumber: order.order_number,
          details: order.special_request_details,
          status: order.special_request_status,
          confidence: order.special_request_confidence || 0,
        });
      }
    });

    // Average processing time
    const avgProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, item) => sum + item.hours, 0) /
          processingTimes.length
        : 0;

    // Special request processing opportunities
    const confidenceDistribution = [0, 0, 0, 0, 0]; // 0-20%, 20-40%, etc.
    specialRequestData.forEach((req) => {
      const confidenceBucket = Math.min(4, Math.floor(req.confidence / 20));
      confidenceDistribution[confidenceBucket]++;
    });

    // Improvement opportunities (these would be AI-generated in a real app)
    const opportunities = [
      {
        title: "Order Processing Automation",
        description:
          "Implement automated verification for standard orders to reduce processing time by ~30%",
        impact: "High",
        difficulty: "Medium",
        aiConfidence: 85,
      },
      {
        title: "Special Request Classification",
        description:
          "Create pre-defined categories for common special requests to streamline handling",
        impact: "Medium",
        difficulty: "Low",
        aiConfidence: 92,
      },
      {
        title: "Retailer Order Templates",
        description:
          "Offer customized templates to top retailers based on their ordering patterns",
        impact: "Medium",
        difficulty: "Low",
        aiConfidence: 78,
      },
    ];

    setInsights((prev) => ({
      ...prev,
      operations: {
        efficiency: {
          average: avgProcessingTime,
          times: processingTimes,
          specialRequests: {
            count: specialRequestData.length,
            distribution: confidenceDistribution,
          },
        },
        opportunities,
      },
    }));
  };

  // Helper for formatted currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const regenerateInsights = () => {
    if (orders.length > 0 && retailers.length > 0 && products.length > 0) {
      generateInsights(orders, retailers, products);
    }
  };

  // Initial placeholder UI
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-2xl font-medium mb-4">Loading AI Insights...</div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="text-blue-500"
        >
          <CpuChipIcon className="h-16 w-16" />
        </motion.div>
        <div className="mt-6 text-gray-500">
          We're analyzing your business data to generate intelligent insights
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-12">
      {/* Header section with gradient background */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white shadow-lg mb-8">
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center space-x-2">
                <CpuChipIcon className="h-8 w-8" />
                <h1 className="text-3xl font-bold">AI Insights</h1>
              </div>
              <p className="text-blue-100 mt-2">
                Discover AI-powered intelligence from your business data
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={regenerateInsights}
                disabled={generating}
              >
                <SparklesIcon className={`h-4 w-4 mr-2 ${generating ? "animate-pulse" : ""}`} />
                {generating ? "Generating..." : "Generate Insights"}
              </Button>
              
              <div className="flex items-center bg-white/10 rounded-lg p-1">
                <CalendarIcon className="h-4 w-4 ml-2" />
                <select 
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="bg-transparent text-white border-none appearance-none px-2 py-1 focus:outline-none text-sm"
                >
                  <option value="last7days" className="text-gray-900">Last 7 Days</option>
                  <option value="last30days" className="text-gray-900">Last 30 Days</option>
                  <option value="last90days" className="text-gray-900">Last 90 Days</option>
                  <option value="lastYear" className="text-gray-900">Last Year</option>
                  <option value="all" className="text-gray-900">All Time</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Insight category tabs */}
        <Tabs
          defaultValue="sales"
          value={insightType}
          onValueChange={setInsightType}
          className="mb-6"
        >
          <TabsList className="w-full bg-gradient-to-r from-indigo-50 to-blue-50 p-1 rounded-xl mb-2">
            <TabsTrigger value="sales" className="flex-1 data-[state=active]:bg-white rounded-lg">
              <ChartPieIcon className="h-5 w-5 mr-2 inline-block" />
              Sales Intelligence
            </TabsTrigger>
            <TabsTrigger value="retailers" className="flex-1 data-[state=active]:bg-white rounded-lg">
              <UserGroupIcon className="h-5 w-5 mr-2 inline-block" />
              Retailer Insights
            </TabsTrigger>
            <TabsTrigger value="products" className="flex-1 data-[state=active]:bg-white rounded-lg">
              <ShoppingBagIcon className="h-5 w-5 mr-2 inline-block" />
              Product Analytics
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex-1 data-[state=active]:bg-white rounded-lg">
              <BoltIcon className="h-5 w-5 mr-2 inline-block" />
              Operational Insights
            </TabsTrigger>
          </TabsList>
          
          {/* Tab contents will be implemented in next steps */}
          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Sales Trend Chart - Takes 2/3 of width */}
              <Card className="shadow-md border-0 lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-blue-900">Revenue Trends & Forecast</CardTitle>
                      <CardDescription>
                        Historical sales analysis with AI-generated predictions
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-100/50 text-blue-700 hover:bg-blue-100">
                      AI Powered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {insights.sales?.predictions ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={insights.sales.predictions}
                          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                        >
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fill: '#64748b' }} />
                          <YAxis 
                            tick={{ fill: '#64748b' }} 
                            tickFormatter={tick => formatCurrency(tick).replace('.00', '')}
                          />
                          <Tooltip 
                            formatter={(value) => [formatCurrency(value), "Revenue"]}
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                              border: 'none'
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            name="Actual Revenue"
                            dot={{ strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={true}
                            animationDuration={1500}
                          />
                          <Line 
                            type="monotone" 
                            dataKey={(d) => d.predicted ? d.value : null} 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="AI Forecast"
                            dot={{ strokeWidth: 2, r: 4, fill: "#8b5cf6" }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={true}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center">
                      <Skeleton className="h-full w-full rounded-xl" />
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Anomaly Detection Card */}
              <Card className="shadow-md border-0">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-amber-900">Anomaly Detection</CardTitle>
                      <CardDescription>
                        Unusual patterns identified by AI
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-amber-100/50 text-amber-700 hover:bg-amber-100">
                      AI Powered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {insights.sales?.anomalies ? (
                    insights.sales.anomalies.length > 0 ? (
                      <div className="space-y-4">
                        {insights.sales.anomalies.map((anomaly, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 rounded-lg border bg-gradient-to-r from-amber-50 to-white"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{anomaly.date}</div>
                                <div className="text-amber-700 font-bold">{formatCurrency(anomaly.value)}</div>
                              </div>
                              <Badge className={parseInt(anomaly.deviation) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {anomaly.deviation}% {parseInt(anomaly.deviation) > 0 ? "above" : "below"} average
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="bg-amber-100 p-3 rounded-full mb-3">
                          <CpuChipIcon className="h-6 w-6 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No anomalies detected</h3>
                        <p className="text-gray-500 mt-1">Your sales patterns appear consistent</p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full rounded-lg" />
                      <Skeleton className="h-20 w-full rounded-lg" />
                      <Skeleton className="h-20 w-full rounded-lg" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="retailers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Retailer Segmentation */}
              <Card className="shadow-md border-0">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-purple-900">Customer Segments</CardTitle>
                      <CardDescription>
                        AI-powered retailer segmentation
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-purple-100/50 text-purple-700 hover:bg-purple-100">
                      AI Powered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {insights.retailers?.segmentData ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={insights.retailers.segmentData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => 
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {insights.retailers.segmentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [value, name]}
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                              border: 'none'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <Skeleton className="h-full w-full rounded-xl" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-purple-50/50 text-sm text-purple-700 italic">
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Focus on converting Occasional buyers to Regular customers for best growth.
                </CardFooter>
              </Card>
              
              {/* Churn Risk */}
              <Card className="shadow-md border-0 lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-rose-900">Churn Risk</CardTitle>
                      <CardDescription>
                        Retailers who may stop ordering soon
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-rose-100/50 text-rose-700 hover:bg-rose-100">
                      AI Powered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {insights.retailers?.churnRisk ? (
                    insights.retailers.churnRisk.length > 0 ? (
                      <div className="divide-y">
                        {insights.retailers.churnRisk.map((retailer, index) => (
                          <motion.div
                            key={retailer.retailerId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="py-3"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{retailer.retailerName}</div>
                                <div className="text-sm text-gray-500">
                                  Last order: {retailer.daysSinceLastOrder} days ago
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge className={retailer.riskLevel === "High" ? 
                                  "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                                  {retailer.riskLevel} Risk
                                </Badge>
                                <div className="text-xs">
                                  <div className="text-gray-500">Confidence</div>
                                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                                    <div 
                                      className={`${retailer.riskLevel === "High" ? "bg-red-500" : "bg-yellow-500"} h-1.5 rounded-full`} 
                                      style={{ width: `${retailer.confidence}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="bg-green-100 p-3 rounded-full mb-3">
                          <UserGroupIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No churn risks detected</h3>
                        <p className="text-gray-500 mt-1">
                          Your retailers are staying active with recent orders
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                  )}
                </CardContent>
                {insights.retailers?.churnRisk && insights.retailers.churnRisk.length > 0 && (
                  <CardFooter className="bg-rose-50/50 text-sm text-rose-700 italic">
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Consider reaching out to these retailers with personalized promotions to re-engage them.
                  </CardFooter>
                )}
              </Card>
            </div>

            {/* Customer Lifetime Value */}
            <Card className="shadow-md border-0">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-teal-900">Top Retailers by Value</CardTitle>
                    <CardDescription>
                      Most valuable customers based on spending patterns
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-teal-100/50 text-teal-700 hover:bg-teal-100">
                    AI Powered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5 overflow-x-auto">
                {insights.retailers?.topRetailers ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retailer</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {insights.retailers.topRetailers.map((retailer, index) => (
                        <motion.tr 
                          key={retailer.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{retailer.name}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(retailer.spent)}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{retailer.orders}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(retailer.aov)}</td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-sm rounded-full bg-teal-100 text-teal-800">
                              {formatCurrency(retailer.predictedValue)}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <Skeleton className="h-64 w-full rounded-xl" />
                )}
              </CardContent>
              <CardFooter className="bg-teal-50/50 text-sm text-teal-700 italic">
                <SparklesIcon className="h-5 w-5 mr-2" />
                Future value predictions are based on historical spending patterns and engagement.
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products by Revenue */}
              <Card className="shadow-md border-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-blue-900">Top Products</CardTitle>
                      <CardDescription>
                        Best selling products by revenue
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-100/50 text-blue-700 hover:bg-blue-100">
                      AI Powered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {insights.products?.topProducts ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={insights.products.topProducts}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            type="number" 
                            tickFormatter={tick => formatCurrency(tick).replace('.00', '')}
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={150} 
                            tick={{ fontSize: 12 }} 
                          />
                          <Tooltip 
                            formatter={(value) => [formatCurrency(value), "Revenue"]}
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                              border: 'none'
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="revenue" 
                            name="Revenue" 
                            fill="#3b82f6" 
                            radius={[0, 4, 4, 0]} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center">
                      <Skeleton className="h-full w-full rounded-xl" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product Affinity Analysis */}
              <Card className="shadow-md border-0">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-purple-900">Product Affinities</CardTitle>
                      <CardDescription>
                        Products frequently purchased together
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-purple-100/50 text-purple-700 hover:bg-purple-100">
                      AI Powered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {insights.products?.affinities ? (
                    insights.products.affinities.length > 0 ? (
                      <div className="space-y-4">
                        {insights.products.affinities.map((pair, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-white border border-purple-100"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-purple-900 mb-1">
                                  {pair.product1} + {pair.product2}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Ordered together {pair.count} times
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="text-xs font-medium text-purple-700">Affinity Strength</div>
                                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                  <div 
                                    className="bg-purple-500 h-2 rounded-full" 
                                    style={{ width: `${Math.min(100, pair.strength * 50)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="bg-purple-100 p-3 rounded-full mb-3">
                          <ShoppingBagIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No strong affinities found</h3>
                        <p className="text-gray-500 mt-1">Your products don't show clear purchasing patterns yet</p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                  )}
                </CardContent>
                {insights.products?.affinities && insights.products.affinities.length > 0 && (
                  <CardFooter className="bg-purple-50/50 text-sm text-purple-700 italic">
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Consider offering these product combinations as bundles to increase average order value.
                  </CardFooter>
                )}
              </Card>
            </div>

            {/* Retailer Product Recommendations */}
            <Card className="shadow-md border-0">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-emerald-900">Smart Recommendations</CardTitle>
                    <CardDescription>
                      AI-powered product recommendations for your retailers
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-emerald-100/50 text-emerald-700 hover:bg-emerald-100">
                    AI Powered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                {insights.products?.recommendations ? (
                  insights.products.recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {insights.products.recommendations.map((rec, index) => (
                        <motion.div
                          key={rec.retailerId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-white border border-emerald-100"
                        >
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                            <div>
                              <div className="font-medium text-emerald-900 mb-1">
                                {rec.retailerName}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Recommended products:</span> {rec.products.join(', ')}
                              </div>
                            </div>
                            <div className="mt-3 md:mt-0 flex items-center">
                              <div className="text-xs font-medium text-emerald-700 mr-2">AI Confidence:</div>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-emerald-500 h-2 rounded-full" 
                                  style={{ width: `${rec.confidence}%` }}
                                ></div>
                              </div>
                              <div className="ml-2 text-xs text-gray-500">{rec.confidence}%</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <div className="bg-emerald-100 p-3 rounded-full mb-3">
                        <SparklesIcon className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No recommendations available</h3>
                      <p className="text-gray-500 mt-1">We need more order data to generate personalized recommendations</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </div>
                )}
              </CardContent>
              {insights.products?.recommendations && insights.products.recommendations.length > 0 && (
                <CardFooter className="bg-emerald-50/50 text-sm text-emerald-700 italic">
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Use these AI-powered suggestions when contacting retailers to increase cross-selling success.
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Processing Efficiency Metrics */}
              <Card className="shadow-md border-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-blue-900">Processing Efficiency</CardTitle>
                      <CardDescription>
                        Order processing time analysis
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-100/50 text-blue-700 hover:bg-blue-100">
                      AI Powered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {insights.operations?.efficiency ? (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center">
                        <div className="text-sm text-gray-500 mb-1">Average Processing Time</div>
                        <div className="text-3xl font-bold text-blue-600">
                          {insights.operations.efficiency.average.toFixed(1)} hours
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Based on {insights.operations.efficiency.times.length} completed orders
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium text-gray-700 mb-3">Processing Time Distribution</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-blue-50 rounded p-2 text-center">
                            <div className="text-xs text-gray-500">Quick</div>
                            <div className="text-lg font-medium text-blue-700">
                              {insights.operations.efficiency.times.filter(t => t.hours < 24).length}
                            </div>
                            <div className="text-xs text-gray-400">{"<24h"}</div>
                          </div>
                          <div className="bg-blue-50 rounded p-2 text-center">
                            <div className="text-xs text-gray-500">Standard</div>
                            <div className="text-lg font-medium text-blue-700">
                              {insights.operations.efficiency.times.filter(t => t.hours >= 24 && t.hours < 48).length}
                            </div>
                            <div className="text-xs text-gray-400">24-48h</div>
                          </div>
                          <div className="bg-blue-50 rounded p-2 text-center">
                            <div className="text-xs text-gray-500">Delayed</div>
                            <div className="text-lg font-medium text-blue-700">
                              {insights.operations.efficiency.times.filter(t => t.hours >= 48).length}
                            </div>
                            <div className="text-xs text-gray-400">{">48h"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full rounded-lg" />
                      <Skeleton className="h-40 w-full rounded-lg" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Special Request Analysis */}
              <Card className="shadow-md border-0">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-amber-900">Special Request Analysis</CardTitle>
                      <CardDescription>
                        AI insights on special order requests
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-amber-100/50 text-amber-700 hover:bg-amber-100">
                      AI Powered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {insights.operations?.efficiency ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Total Special Requests</div>
                          <div className="text-3xl font-bold text-amber-600">
                            {insights.operations.efficiency.specialRequests.count}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">Processing Impact</div>
                          <div className="text-lg font-medium text-amber-600">
                            +{(insights.operations.efficiency.times.filter(t => t.hasSpecialRequest).reduce((sum, t) => sum + t.hours, 0) / 
                                (insights.operations.efficiency.times.filter(t => t.hasSpecialRequest).length || 1) -
                                insights.operations.efficiency.times.filter(t => !t.hasSpecialRequest).reduce((sum, t) => sum + t.hours, 0) / 
                                (insights.operations.efficiency.times.filter(t => !t.hasSpecialRequest).length || 1)).toFixed(1)}h
                          </div>
                          <div className="text-xs text-gray-400">average added time</div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium text-gray-700 mb-3">AI Confidence Distribution</div>
                        <div className="flex h-8 w-full rounded-md overflow-hidden">
                          {insights.operations.efficiency.specialRequests.distribution.map((count, index) => (
                            <div 
                              key={index}
                              className={`h-full ${
                                index === 0 ? 'bg-red-400' : 
                                index === 1 ? 'bg-orange-400' : 
                                index === 2 ? 'bg-yellow-400' : 
                                index === 3 ? 'bg-lime-400' : 
                                'bg-green-400'
                              }`}
                              style={{ 
                                width: `${count ? (count / insights.operations.efficiency.specialRequests.count) * 100 : 0}%`,
                                minWidth: count ? '4%' : '0' 
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                          <span>Low (0-20%)</span>
                          <span>Medium (40-60%)</span>
                          <span>High (80-100%)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full rounded-lg" />
                      <Skeleton className="h-40 w-full rounded-lg" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI-Powered Improvement Opportunities */}
            <Card className="shadow-md border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-indigo-900">Improvement Opportunities</CardTitle>
                    <CardDescription>
                      AI-identified ways to optimize your operations
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-indigo-100/50 text-indigo-700 hover:bg-indigo-100">
                    AI Powered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                {insights.operations?.opportunities ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insights.operations.opportunities.map((opportunity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-white border border-indigo-100"
                      >
                        <div className="text-lg font-medium text-indigo-900 mb-2">
                          {opportunity.title}
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          {opportunity.description}
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <div>
                            <Badge className={
                              opportunity.impact === "High" ? "bg-green-100 text-green-800" :
                              opportunity.impact === "Medium" ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {opportunity.impact} Impact
                            </Badge>
                          </div>
                          <div>
                            <Badge variant="outline" className={
                              opportunity.difficulty === "Low" ? "border-green-200 text-green-800" :
                              opportunity.difficulty === "Medium" ? "border-yellow-200 text-yellow-800" :
                              "border-red-200 text-red-800"
                            }>
                              {opportunity.difficulty} Effort
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center">
                          <div className="text-xs font-medium text-indigo-700 mr-2">AI Confidence:</div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-indigo-500 h-1.5 rounded-full" 
                              style={{ width: `${opportunity.aiConfidence}%` }}
                            ></div>
                          </div>
                          <div className="ml-2 text-xs text-gray-500">{opportunity.aiConfidence}%</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-indigo-50/50 text-sm text-indigo-700 italic">
                <SparklesIcon className="h-5 w-5 mr-2" />
                These opportunities are ranked by potential impact relative to implementation effort.
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 