import React from 'react';
import { Mail, Package, AlertTriangle, FileText, GitBranch, DollarSign, Bell, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NodePanel({ onDragStart, filter }) {
  const nodeTypes = [
    {
      type: 'email',
      label: 'Email Configuration',
      description: 'Configure email tracking settings',
      icon: <Mail className="h-4 w-4" />,
      color: 'bg-blue-500',
      borderColor: 'border-blue-400',
      category: 'input'
    },
    {
      type: 'product',
      label: 'Product List',
      description: 'Add products to track',
      icon: <Package className="h-4 w-4" />,
      color: 'bg-green-500',
      borderColor: 'border-green-400',
      category: 'input'
    },
    {
      type: 'exception',
      label: 'Exception Products',
      description: 'Configure product exceptions',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-amber-500',
      borderColor: 'border-amber-400',
      category: 'process'
    },
    {
      type: 'invoice',
      label: 'Invoice Template',
      description: 'Design invoice layout',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-purple-500',
      borderColor: 'border-purple-400',
      category: 'output'
    },
    {
      type: 'conditional',
      label: 'Conditional Logic',
      description: 'Add if/then branching logic',
      icon: <GitBranch className="h-4 w-4" />,
      color: 'bg-orange-500',
      borderColor: 'border-orange-400',
      category: 'process'
    },
    {
      type: 'price_adjustment',
      label: 'Price Adjustment',
      description: 'Modify pricing for products',
      icon: <DollarSign className="h-4 w-4" />,
      color: 'bg-pink-500',
      borderColor: 'border-pink-400',
      category: 'process'
    },
    {
      type: 'notification',
      label: 'Notification',
      description: 'Configure alerts and notifications',
      icon: <Bell className="h-4 w-4" />,
      color: 'bg-cyan-500',
      borderColor: 'border-cyan-400',
      category: 'output'
    },
    {
      type: 'vip',
      label: 'VIP Customer',
      description: 'Special handling for VIP customers',
      icon: <Trophy className="h-4 w-4" />,
      color: 'bg-violet-500',
      borderColor: 'border-violet-400',
      category: 'process'
    },
  ];

  // Filter nodes if a filter is provided
  const filteredNodes = filter 
    ? nodeTypes.filter(node => filter.includes(node.type))
    : nodeTypes;

  return (
    <div className="p-3 overflow-y-auto">
      <h2 className="text-base font-semibold mb-3 text-gray-800 dark:text-white">Workflow Nodes</h2>
      <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
        Build your workflow by connecting nodes
      </p>
      
      <div className="space-y-2">
        {filteredNodes.map((node, index) => (
          <motion.div
            key={node.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onDragStart={(event) => onDragStart(event, node.type)}
            draggable
            className={`
              group cursor-grab rounded-md p-2 border-l-4 ${node.borderColor}
              hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700
              transition-all duration-200 ease-in-out
              transform hover:-translate-y-1
            `}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${node.color} text-white`}>
                {node.icon}
              </div>
              <div>
                <h3 className="font-medium text-xs text-gray-800 dark:text-white">{node.label}</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{node.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {filteredNodes.length === 0 && (
        <div className="text-center py-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">No nodes available in this category</p>
        </div>
      )}
      
      <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md">
        <h3 className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Pro Tip</h3>
        <p className="text-[10px] text-blue-600 dark:text-blue-400">
          Drag nodes to the canvas and connect them to build your workflow.
        </p>
      </div>
    </div>
  );
} 