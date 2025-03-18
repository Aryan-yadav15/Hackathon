'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FaEnvelope, FaBox, FaExclamationTriangle, 
  FaFileInvoiceDollar, FaRandom, FaMoneyBillWave, FaBell,
  FaArrowRight, FaArrowDown, FaArrowUp, FaUserPlus, FaCrown, FaHandshake,
  FaShippingFast, FaUserCheck, FaList, FaTags
} from 'react-icons/fa';

// Export the workflow data directly so it can be imported elsewhere
export const orderProcessingWorkflow = {
  nodes: [
    // Email Parser
    {
      id: 'email-parser',
      type: 'email',
      position: { x: 600, y: 50 },
      data: {
        type: 'email',
        label: 'Email Parser',
        configured: true,
        email: 'orders@company.com',
        connectTo: ['product', 'conditional', 'notification']
      }
    },
    // Sender Type Check
    {
      id: 'sender-type-check',
      type: 'conditional',
      position: { x: 600, y: 150 },
      data: {
        type: 'conditional',
        label: 'Sender Type Check',
        configured: true,
        condition: 'sender_condition',
        connectTo: ['email', 'product', 'exception', 'invoice', 'price_adjustment', 'notification']
      }
    },
    // Product Type
    {
      id: 'product-type',
      type: 'conditional',
      position: { x: 1000, y: 220 },
      data: {
        type: 'conditional',
        label: 'Product Type',
        configured: true,
        condition: 'product_type_condition',
        connectTo: ['email', 'product', 'exception', 'invoice', 'price_adjustment', 'notification']
      }
    },
    // Welcome New Customer
    {
      id: 'welcome-customer',
      type: 'notification',
      position: { x: 300, y: 250 },
      data: {
        type: 'notification',
        label: 'Welcome New Customer',
        configured: true,
        alertType: 'email_alert'
      }
    },
    // Extract Products
    {
      id: 'extract-products',
      type: 'product',
      position: { x: 200, y: 360 },
      data: {
        type: 'product',
        label: 'Extract Products',
        configured: true,
        products: 3,
        connectTo: ['exception', 'invoice', 'conditional', 'price_adjustment', 'notification']
      }
    },
    // Extract VIP Products
    {
      id: 'extract-vip-products',
      type: 'product',
      position: { x: 600, y: 280 },
      data: {
        type: 'product',
        label: 'Extract VIP Products',
        configured: true,
        products: 3,
        connectTo: ['exception', 'invoice', 'conditional', 'price_adjustment', 'notification']
      }
    },
    // Bulk Products
    {
      id: 'bulk-products',
      type: 'product',
      position: { x: 840, y: 330 },
      data: {
        type: 'product',
        label: 'Bulk Products',
        configured: true,
        products: 5,
        connectTo: ['exception', 'invoice', 'conditional', 'price_adjustment', 'notification']
      }
    },
    // Special Products
    {
      id: 'special-products',
      type: 'product',
      position: { x: 1040, y: 510 },
      data: {
        type: 'product',
        label: 'Special Products',
        configured: true,
        products: 1,
        connectTo: ['exception', 'invoice', 'conditional', 'price_adjustment', 'notification']
      }
    },
    // New Customer Price
    {
      id: 'new-customer-price',
      type: 'price_adjustment',
      position: { x: 200, y: 460 },
      data: {
        type: 'price_adjustment',
        label: 'New Customer Price',
        configured: true,
        percentage: '10%',
        connectTo: ['invoice', 'notification']
      }
    },
    // VIP Discount
    {
      id: 'vip-discount',
      type: 'price_adjustment',
      position: { x: 600, y: 400 },
      data: {
        type: 'price_adjustment',
        label: 'VIP Discount',
        configured: true,
        percentage: '15%',
        connectTo: ['invoice', 'notification']
      }
    },
    // Order Value Check
    {
      id: 'order-value-check',
      type: 'conditional',
      position: { x: 480, y: 460 },
      data: {
        type: 'conditional',
        label: 'Order Value Check',
        configured: true,
        condition: 'order_value_condition',
        connectTo: ['email', 'product', 'exception', 'invoice', 'price_adjustment', 'notification']
      }
    },
    // Stock Check
    {
      id: 'stock-check',
      type: 'exception',
      position: { x: 780, y: 430 },
      data: {
        type: 'exception',
        label: 'Stock Check',
        configured: true,
        rules: 1,
        connectTo: ['invoice', 'conditional', 'notification']
      }
    },
    // Manual Review
    {
      id: 'manual-review',
      type: 'exception',
      position: { x: 1160, y: 410 },
      data: {
        type: 'exception',
        label: 'Manual Review',
        configured: true,
        alertType: 'system_alert'
      }
    },
    // Generate Invoice
    {
      id: 'generate-invoice',
      type: 'invoice',
      position: { x: 140, y: 550 },
      data: {
        type: 'invoice',
        label: 'Generate Invoice',
        configured: true
      }
    },
    // Standard VIP Invoice
    {
      id: 'standard-vip-invoice',
      type: 'invoice',
      position: { x: 400, y: 570 },
      data: {
        type: 'invoice',
        label: 'Standard VIP Invoice',
        configured: true
      }
    },
    // Free Shipping
    {
      id: 'free-shipping',
      type: 'price_adjustment',
      position: { x: 590, y: 570 },
      data: {
        type: 'price_adjustment',
        label: 'Free Shipping',
        configured: true,
        rules: 0,
        connectTo: ['invoice', 'notification']
      }
    },
    // Partner Bulk Invoice
    {
      id: 'partner-bulk-invoice',
      type: 'invoice',
      position: { x: 780, y: 530 },
      data: {
        type: 'invoice',
        label: 'Partner Bulk Invoice',
        configured: true
      }
    },
    // Partner Special Invoice
    {
      id: 'partner-special-invoice',
      type: 'invoice',
      position: { x: 1040, y: 630 },
      data: {
        type: 'invoice',
        label: 'Partner Special Invoice',
        configured: true
      }
    },
    // Upsell Notification
    {
      id: 'upsell-notification',
      type: 'notification',
      position: { x: 400, y: 650 },
      data: {
        type: 'notification',
        label: 'Upsell Notification',
        configured: true,
        alertType: 'email_alert'
      }
    },
    // VIP Invoice (High Value)
    {
      id: 'vip-invoice-high',
      type: 'invoice',
      position: { x: 600, y: 720 },
      data: {
        type: 'invoice',
        label: 'VIP Invoice (High Value)',
        configured: true
      }
    },
    // Email (Final)
    {
      id: 'email-final',
      type: 'email',
      position: { x: 1250, y: 630 },
      data: {
        type: 'email',
        label: 'Email',
        configured: true,
        connectTo: ['product', 'conditional', 'notification']
      }
    }
  ],
  edges: [
    // Initial connections
    { id: 'e1', source: 'email-parser', target: 'sender-type-check' },
    
    // Sender type check connections
    { id: 'e2', source: 'sender-type-check', target: 'welcome-customer' },
    { id: 'e3', source: 'sender-type-check', target: 'extract-vip-products' },
    { id: 'e4', source: 'sender-type-check', target: 'product-type' },
    
    // Welcome new customer flow
    { id: 'e5', source: 'welcome-customer', target: 'extract-products' },
    { id: 'e6', source: 'extract-products', target: 'new-customer-price' },
    { id: 'e7', source: 'new-customer-price', target: 'generate-invoice' },
    
    // VIP Products flow
    { id: 'e8', source: 'extract-vip-products', target: 'vip-discount' },
    { id: 'e9', source: 'vip-discount', target: 'order-value-check' },
    { id: 'e10', source: 'order-value-check', target: 'standard-vip-invoice' },
    { id: 'e11', source: 'standard-vip-invoice', target: 'upsell-notification' },
    { id: 'e12', source: 'order-value-check', target: 'free-shipping' },
    { id: 'e13', source: 'free-shipping', target: 'vip-invoice-high' },
    
    // Product type connections
    { id: 'e14', source: 'product-type', target: 'bulk-products' },
    { id: 'e15', source: 'product-type', target: 'manual-review' },
    { id: 'e16', source: 'product-type', target: 'special-products' },
    
    // Bulk products flow
    { id: 'e17', source: 'bulk-products', target: 'stock-check' },
    { id: 'e18', source: 'stock-check', target: 'partner-bulk-invoice' },
    
    // Special products flow
    { id: 'e19', source: 'special-products', target: 'partner-special-invoice' },
    
    // Final connections
    { id: 'e20', source: 'manual-review', target: 'special-products' },
    { id: 'e21', source: 'partner-special-invoice', target: 'email-final' }
  ]
};

export const retailerGroupWorkflow = {
  // Define your default workflow structure here
  nodes: [
    // Your nodes
  ],
  edges: [
    // Your edges
  ]
}

export default function DemoWorkflow({ onLoad }) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">Order Processing Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="text-sm">
            This workflow demonstrates a comprehensive order processing system with different paths based on
            sender type, product categories, and order values.
          </p>
          
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
              <FaEnvelope className="mt-1 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Email Processing</h3>
                <p className="text-xs text-gray-600">
                  Orders arrive via email and get parsed before being routed to the appropriate workflow.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-md">
              <FaCrown className="mt-1 text-purple-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium">VIP Customer Flow</h3>
                <p className="text-xs text-gray-600">
                  VIP customers receive special discounts, free shipping on high-value orders, and custom invoicing.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-md">
              <FaUserPlus className="mt-1 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium">New Customer Flow</h3>
                <p className="text-xs text-gray-600">
                  Sends welcome notifications, applies first-order discounts, and generates a special welcome invoice.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-md">
              <FaBox className="mt-1 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Bulk & Special Products</h3>
                <p className="text-xs text-gray-600">
                  Special handling for bulk orders with inventory checks and custom partner invoicing for special products.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium text-sm">Benefits of this Workflow</h3>
            <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
              <li>Intelligently routes orders based on <strong>sender type and product category</strong></li>
              <li>Provides <strong>special treatment for VIP customers</strong> including discounts and free shipping</li>
              <li>Handles <strong>inventory checks</strong> for bulk orders</li>
              <li>Implements <strong>custom invoicing</strong> for different order types</li>
              <li>Sends relevant <strong>notifications</strong> at key points in the workflow</li>
            </ul>
          </div>
        </div>
        
        <Button 
          className="w-full mt-5 bg-blue-600 hover:bg-blue-700"
          onClick={() => onLoad && onLoad(orderProcessingWorkflow)}
        >
          Load Order Processing Workflow Demo
        </Button>
      </CardContent>
    </Card>
  );
} 