'use client'

import React, { useState } from 'react';
import { Separator } from "@/components/ui/separator";
import NodePanel from './NodePanel';
import { FaEnvelope, FaBox, FaExclamationTriangle, FaFileInvoiceDollar, FaCodeBranch, FaPercentage, FaBell } from 'react-icons/fa'
import { Button } from '@/components/ui/button';
import { PlayCircleIcon } from 'lucide-react';

export default function Sidebar({ onDragStart, onLoadDemoWorkflow }) {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const categories = [
    { id: 'all', label: 'All Nodes' },
    { id: 'input', label: 'Input' },
    { id: 'process', label: 'Processing' },
    { id: 'output', label: 'Output' }
  ];
  
  const categoryMap = {
    'input': ['email', 'product'],
    'process': ['exception', 'conditional', 'price_adjustment', 'vip'],
    'output': ['invoice', 'notification']
  };
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-[220px]">
      {/* Categories */}
      <div className="flex items-center p-2 gap-1 overflow-x-auto no-scrollbar">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`
              px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
              transition-colors duration-200
              ${activeCategory === category.id 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}
            `}
          >
            {category.label}
          </button>
        ))}
      </div>
      
      <Separator />
      
      {/* Filtered Node Panel */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <NodePanel 
          onDragStart={onDragStart} 
          filter={activeCategory === 'all' ? null : categoryMap[activeCategory]}
        />
      </div>
      
      {/* Demo Workflow Button */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <Button 
          onClick={onLoadDemoWorkflow}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center gap-2"
          size="sm"
        >
          <PlayCircleIcon className="h-4 w-4" />
          <span>Load Order Processing Workflow</span>
        </Button>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 text-center">
          Start with a pre-built workflow template
        </p>
      </div>
      
      {/* Tips Section */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Tips</h3>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 text-lg leading-none">•</span>
            <span>Drag nodes onto the canvas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 text-lg leading-none">•</span>
            <span>Connect nodes by dragging between handles</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 text-lg leading-none">•</span>
            <span>Configure nodes by clicking on them</span>
          </li>
        </ul>
      </div>
    </div>
  );
} 