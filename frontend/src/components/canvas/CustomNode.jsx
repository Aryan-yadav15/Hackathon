'use client'

import React from 'react'
import { Handle, Position } from 'reactflow'
import { useWorkflow } from '@/context/WorkflowContext'
import { FaEnvelope, FaBox, FaExclamationTriangle, FaFileInvoiceDollar, FaRandom, FaMoneyBillWave, FaBell, FaUsers } from 'react-icons/fa'
import EmailConfigModal from './modals/EmailConfigModal'
import ProductConfigModal from './modals/ProductConfigModal'
import ExceptionConfigModal from './modals/ExceptionConfigModal'
import InvoiceConfigModal from './modals/InvoiceConfigModal'
import ConditionalConfigModal from './modals/ConditionalConfigModal'
import PriceAdjustmentConfigModal from './modals/PriceAdjustmentConfigModal'
import NotificationConfigModal from './modals/NotificationConfigModal'
import { CheckCircle2 } from "lucide-react"
import RetailerGroupNode from './nodes/RetailerGroupNode'

const icons = {
  email: <FaEnvelope className="w-5 h-5 text-blue-500" />,
  product: <FaBox className="w-5 h-5 text-green-500" />,
  exception: <FaExclamationTriangle className="w-5 h-5 text-yellow-500" />,
  invoice: <FaFileInvoiceDollar className="w-5 h-5 text-purple-500" />,
  conditional: <FaRandom className="w-5 h-5 text-red-500" />,
  price_adjustment: <FaMoneyBillWave className="w-5 h-5 text-teal-500" />,
  notification: <FaBell className="w-5 h-5 text-orange-500" />,
  retailer_group: <FaUsers className="w-5 h-5 text-purple-500" />
}

const colors = {
  email: 'border-blue-500 bg-blue-50',
  product: 'border-green-500 bg-green-50',
  exception: 'border-yellow-500 bg-yellow-50',
  invoice: 'border-purple-500 bg-purple-50',
  conditional: 'border-orange-500 bg-orange-50',
  price_adjustment: 'border-pink-500 bg-pink-50',
  notification: 'border-indigo-500 bg-indigo-50',
  retailer_group: 'border-purple-500 bg-purple-50'
}

const nodeIcons = {
  email: FaEnvelope,
  product: FaBox,
  exception: FaExclamationTriangle,
  invoice: FaFileInvoiceDollar,
  conditional: FaRandom,
  price_adjustment: FaMoneyBillWave,
  notification: FaBell
}

const modalComponents = {
  email: EmailConfigModal,
  product: ProductConfigModal,
  exception: ExceptionConfigModal,
  invoice: InvoiceConfigModal,
  conditional: ConditionalConfigModal,
  price_adjustment: PriceAdjustmentConfigModal,
  notification: NotificationConfigModal
}

const nodeTypes = {
  customNode: CustomNode,
  retailerGroup: RetailerGroupNode
}

export default function CustomNode({ id, data, isConnectable, selected }) {
  const { setSelectedNode } = useWorkflow()
  
  const handleNodeClick = (e) => {
    e.stopPropagation()
    console.log("Node clicked:", id, data)
    setSelectedNode({ id, type: data.type, data })
  }

  // Map of node types to valid next node types
  const validNextNodes = {
    email: ['product', 'conditional', 'notification'],
    product: ['exception', 'invoice', 'conditional', 'price_adjustment', 'notification'],
    exception: ['invoice', 'conditional', 'notification'],
    invoice: [],
    conditional: ['email', 'product', 'exception', 'invoice', 'price_adjustment', 'notification'],
    price_adjustment: ['invoice', 'notification'],
    notification: [],
    retailer_group: ['conditional', 'price_adjustment', 'notification', 'invoice']
  }

  // Get handle style based on node type
  const getSourceHandleStyle = () => {
    // If this node can't connect to anything, disable the handle
    if (validNextNodes[data.type]?.length === 0) {
      return "!bg-gray-300 opacity-50 w-3 h-3 cursor-not-allowed"
    }
    
    // Otherwise, show an active handle
    return "!bg-blue-500 w-3 h-3 hover:!bg-green-500 hover:w-4 hover:h-4 transition-all"
  }

  return (
    <div
      className={`px-4 py-2 shadow-md rounded-lg border-2 ${
        colors[data.type]
      } ${
        selected ? 'ring-2 ring-blue-400' : ''
      }`}
      onClick={handleNodeClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-500 w-3 h-3 hover:!bg-blue-500 hover:w-4 hover:h-4 transition-all"
      />
      
      <div className="flex items-center">
        <div className="mr-2 relative">
          {icons[data.type]}
          {data.configured && (
            <CheckCircle2 className="h-3 w-3 text-green-500 absolute -right-1 -top-1 bg-white rounded-full" />
          )}
        </div>
        <div>
          <div className="text-sm font-medium">{data.label}</div>
          {data.configured && (
            <div className="text-xs text-gray-500">
              {data.type === 'email' && `Tracking: ${data.email}`}
              {data.type === 'product' && `Products: ${data.productCount || 0}`}
              {data.type === 'exception' && `Rules: ${data.ruleCount || 0}`}
              {data.type === 'conditional' && `${data.conditionType || 'Logic'} condition`}
              {data.type === 'price_adjustment' && `${data.adjustmentType || 'Amount'}: ${data.value || 0}${data.adjustmentType === 'percentage' ? '%' : ''}`}
              {data.type === 'notification' && `${data.notificationType || 'General'} alert`}
            </div>
          )}
        </div>
      </div>
      
      {/* Next possible steps indicator */}
      {validNextNodes[data.type]?.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 border-t pt-1">
          <div className="font-semibold">Connect to:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {validNextNodes[data.type].map(type => (
              <span key={type} className="px-1 bg-gray-100 rounded text-xxs">
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className={getSourceHandleStyle()}
        isConnectable={validNextNodes[data.type]?.length > 0}
      />
    </div>
  )
} 