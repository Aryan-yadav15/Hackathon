'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { 
  FaEnvelope, FaBox, FaExclamationTriangle, 
  FaFileInvoiceDollar, FaCodeBranch, FaPercentage, FaBell 
} from 'react-icons/fa';

export default function WorkflowNode({ data, isConnectable, selected, style }) {
  // Helper function to get border color based on node type
  const getBorderColor = (type) => {
    const colorMap = {
      'email': 'border-blue-500',
      'product': 'border-green-500',
      'exception': 'border-yellow-500',
      'invoice': 'border-purple-500',
      'conditional': 'border-orange-500',
      'price_adjustment': 'border-pink-500',
      'notification': 'border-indigo-500',
      'vip': 'border-red-500'
    };
    return colorMap[type] || 'border-gray-500';
  };
  
  // Helper function to get header background color
  const getHeaderBgColor = (type) => {
    const colorMap = {
      'email': 'bg-blue-500',
      'product': 'bg-green-500',
      'exception': 'bg-yellow-500',
      'invoice': 'bg-purple-500',
      'conditional': 'bg-orange-500',
      'price_adjustment': 'bg-pink-500',
      'notification': 'bg-indigo-500',
      'vip': 'bg-red-500'
    };
    return colorMap[type] || 'bg-gray-500';
  };
  
  // Helper function to get the node icon
  const getNodeIcon = (type) => {
    const iconMap = {
      'email': <FaEnvelope className="w-4 h-4" />,
      'product': <FaBox className="w-4 h-4" />,
      'exception': <FaExclamationTriangle className="w-4 h-4" />,
      'invoice': <FaFileInvoiceDollar className="w-4 h-4" />,
      'conditional': <FaCodeBranch className="w-4 h-4" />,
      'price_adjustment': <FaPercentage className="w-4 h-4" />,
      'notification': <FaBell className="w-4 h-4" />
    };
    return iconMap[type] || null;
  };

  return (
    <div
      className={`
        rounded-lg shadow-lg border-2 
        ${getBorderColor(data.type)}
        bg-white dark:bg-gray-800
        transition-all duration-300 ease-in-out
        hover:shadow-xl hover:scale-[1.02]
        ${isConnectable ? 'cursor-pointer' : ''}
      `}
      style={{ width: 220, ...style }}
    >
      <div className={`
        px-3 py-2 rounded-t-md font-medium flex items-center gap-2
        ${getHeaderBgColor(data.type)} text-white
      `}>
        {getNodeIcon(data.type)}
        <span className="truncate">{data.label}</span>
      </div>
      
      <div className="p-3 text-xs">
        <p className="text-gray-600 dark:text-gray-300">
          {data.description || 'Configure this node by clicking on it'}
        </p>
        
        {data.configured && (
          <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span>Configured</span>
          </div>
        )}
      </div>
      
      {/* Source handle (output) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source"
        style={{ background: '#555', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
      
      {/* Target handle (input) */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        style={{ background: '#555', width: 10, height: 10 }}
        isConnectable={isConnectable}
      />
    </div>
  );
} 