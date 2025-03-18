'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FaEnvelope, FaBox, FaExclamationTriangle, 
  FaFileInvoiceDollar, FaRandom, FaMoneyBillWave, FaBell,
  FaArrowRight
} from 'react-icons/fa';

export default function WorkflowGuide() {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Workflow Logic Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-gray-600 mb-2">
          Connect nodes in logical order:
        </div>
        
        <div className="flex flex-col gap-2">
          {/* Logical flow examples */}
          <div className="flex items-center gap-1 text-xs">
            <div className="flex items-center justify-center p-1 bg-blue-50 border border-blue-200 rounded">
              <FaEnvelope className="text-blue-500 w-3 h-3" />
              <span className="ml-1">Email</span>
            </div>
            <FaArrowRight className="text-gray-400 w-3 h-3" />
            <div className="flex items-center justify-center p-1 bg-green-50 border border-green-200 rounded">
              <FaBox className="text-green-500 w-3 h-3" />
              <span className="ml-1">Product</span>
            </div>
            <FaArrowRight className="text-gray-400 w-3 h-3" />
            <div className="flex items-center justify-center p-1 bg-yellow-50 border border-yellow-200 rounded">
              <FaExclamationTriangle className="text-yellow-500 w-3 h-3" />
              <span className="ml-1">Exception</span>
            </div>
            <FaArrowRight className="text-gray-400 w-3 h-3" />
            <div className="flex items-center justify-center p-1 bg-purple-50 border border-purple-200 rounded">
              <FaFileInvoiceDollar className="text-purple-500 w-3 h-3" />
              <span className="ml-1">Invoice</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-xs">
            <div className="flex items-center justify-center p-1 bg-blue-50 border border-blue-200 rounded">
              <FaEnvelope className="text-blue-500 w-3 h-3" />
              <span className="ml-1">Email</span>
            </div>
            <FaArrowRight className="text-gray-400 w-3 h-3" />
            <div className="flex items-center justify-center p-1 bg-red-50 border border-red-200 rounded">
              <FaRandom className="text-red-500 w-3 h-3" />
              <span className="ml-1">Conditional</span>
            </div>
            <FaArrowRight className="text-gray-400 w-3 h-3" />
            <div className="flex items-center justify-center p-1 bg-green-50 border border-green-200 rounded">
              <FaBox className="text-green-500 w-3 h-3" />
              <span className="ml-1">Product</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-600">
          <strong>Tips:</strong>
          <ul className="list-disc pl-4 mt-1 space-y-1">
            <li>Start with an Email node to process incoming messages</li>
            <li>Use Product nodes to extract product information</li>
            <li>Add Conditional nodes to create different processing paths</li>
            <li>End with Invoice or Notification nodes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 