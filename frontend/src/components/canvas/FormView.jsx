'use client'

import { CheckCircle2, Plus, Trash2 } from "lucide-react"
import { FaEnvelope, FaBox, FaExclamationTriangle, FaFileInvoiceDollar, FaCodeBranch, FaPercentage, FaBell } from "react-icons/fa"
import EmailConfigModal from "../canvas/modals/EmailConfigModal"
import ProductConfigModal from "../canvas/modals/ProductConfigModal"
import ExceptionConfigModal from "../canvas/modals/ExceptionConfigModal"
import InvoiceConfigModal from "../canvas/modals/InvoiceConfigModal"
import ConditionalConfigModal from "../canvas/modals/ConditionalConfigModal"
import PriceAdjustmentConfigModal from "../canvas/modals/PriceAdjustmentConfigModal"
import NotificationConfigModal from "../canvas/modals/NotificationConfigModal"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const nodeTypes = [
  {
    type: 'email',
    label: 'Email Configuration',
    icon: <FaEnvelope className="w-5 h-5 text-blue-500" />
  },
  {
    type: 'product',
    label: 'Product List',
    icon: <FaBox className="w-5 h-5 text-green-500" />
  },
  {
    type: 'exception',
    label: 'Exception Products',
    icon: <FaExclamationTriangle className="w-5 h-5 text-yellow-500" />
  },
  {
    type: 'invoice',
    label: 'Invoice Template',
    icon: <FaFileInvoiceDollar className="w-5 h-5 text-purple-500" />
  },
  {
    type: 'conditional',
    label: 'Conditional Logic',
    icon: <FaCodeBranch className="w-5 h-5 text-orange-500" />
  },
  {
    type: 'price_adjustment',
    label: 'Price Adjustment',
    icon: <FaPercentage className="w-5 h-5 text-pink-500" />
  },
  {
    type: 'notification',
    label: 'Notification',
    icon: <FaBell className="w-5 h-5 text-sky-500" />
  }
]

// Define which node types are essential (simple) for form view
const essentialNodeTypes = ['email', 'product', 'exception', 'invoice'];

// Filter the nodeTypes array to only include essential nodes
const formViewNodeTypes = nodeTypes.filter(node => 
  essentialNodeTypes.includes(node.type)
);

// Add this function to check if workflow contains advanced nodes
const hasAdvancedNodes = (workflowNodes) => {
  return workflowNodes.some(node => 
    !essentialNodeTypes.includes(node.data?.type)
  );
}

export default function FormView({ nodes, onSave, onAddNode, onSaveWorkflow }) {
  const [selectedNode, setSelectedNode] = useState(null)
  const [newNodeType, setNewNodeType] = useState('')

  const handleAddNode = () => {
    if (!newNodeType) return

    const nodeType = nodeTypes.find(nt => nt.type === newNodeType)
    onAddNode({
      type: newNodeType,
      label: nodeType.label,
      configured: false
    })
    setNewNodeType('')
  }

  const renderConfigForm = (node) => {
    const commonProps = {
      onSave: (data) => {
        onSave(node.id, data)
        setSelectedNode(null)
      },
      initialData: node.data,
      isFormView: true
    }

    switch (node.data.type) {
      case "email":
        return <EmailConfigModal {...commonProps} />
      case "product":
        return <ProductConfigModal {...commonProps} />
      case "exception":
        return <ExceptionConfigModal {...commonProps} />
      case "invoice":
        return <InvoiceConfigModal {...commonProps} />
      case "conditional":
        return <ConditionalConfigModal {...commonProps} />
      case "price_adjustment":
        return <PriceAdjustmentConfigModal {...commonProps} />
      case "notification":
        return <NotificationConfigModal {...commonProps} />
      default:
        return <div>Unknown node type: {node.data.type}</div>
    }
  }

  const getNodeTypeInfo = (type) => {
    return nodeTypes.find(nt => nt.type === type) || {
      icon: <div className="w-5 h-5 bg-gray-300 rounded-full" />,
      label: 'Unknown Type'
    }
  }

  // Add this to the beginning of the component, after defining state
  const advancedNodes = nodes.filter(node => 
    !essentialNodeTypes.includes(node.data?.type)
  );

  // Then in the nodes list JSX section, after displaying the essential nodes:
  {advancedNodes.length > 0 && (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Advanced Nodes (Canvas View Only)</h3>
      <div className="space-y-2">
        {advancedNodes.map(node => (
          <div key={node.id} className="flex items-center p-3 border border-gray-200 bg-gray-50 rounded-md opacity-70">
            <div className="mr-3">
              {getNodeIcon(node.data.type)}
            </div>
            <div>
              <p className="text-sm font-medium">{node.data.label}</p>
              <p className="text-xs text-gray-500">This node can only be edited in Canvas View</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  // Add this helper function to get the appropriate icon
  const getNodeIcon = (type) => {
    const nodeType = nodeTypes.find(nt => nt.type === type);
    return nodeType ? nodeType.icon : null;
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Steps */}
      <div className="w-64 border-r p-4 bg-white">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Configuration Steps</h3>
          <p className="text-sm text-gray-500">Build your workflow in order:</p>
          <p className="text-xs text-gray-400 mt-1">
            Email → Products → Exceptions → Invoice
          </p>
          
          {/* Add Step Section */}
          <div className="mt-4 space-y-2">
            <Select
              value={newNodeType}
              onValueChange={setNewNodeType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select node type" />
              </SelectTrigger>
              <SelectContent>
                {formViewNodeTypes.map((nodeType) => (
                  <SelectItem key={nodeType.type} value={nodeType.type}>
                    <div className="flex items-center gap-2">
                      {nodeType.icon}
                      <span>{nodeType.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddNode} 
              disabled={!newNodeType}
              className="w-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {nodes.map((node, index) => {
            const nodeTypeInfo = getNodeTypeInfo(node.data.type)
            return (
              <div
                key={node.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                  ${selectedNode?.id === node.id 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedNode(node)}
              >
                <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full">
                  <span className="text-sm text-gray-600">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {nodeTypeInfo.icon}
                    <h4 className="text-sm font-medium">{node.data.label || nodeTypeInfo.label}</h4>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {node.data.configured 
                      ? node.data.type === 'email' 
                        ? `Tracking: ${node.data.email}`
                        : node.data.type === 'product'
                        ? `Products: ${node.data.productCount || 0}`
                        : node.data.type === 'exception'
                        ? `Rules: ${node.data.ruleCount || 0}`
                        : 'Configured'
                      : 'Not configured'}
                  </p>
                </div>
                {node.data.configured && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                )}
              </div>
            )
          })}
        </div>
        
        {/* Modified Save Workflow section */}
        {nodes.length > 0 && (
          <div className="mt-6">
            <Button 
              onClick={onSaveWorkflow} 
              className="w-full"
              variant="default"
            >
              Save Workflow
            </Button>
          </div>
        )}
      </div>

      {/* Main Content - Configuration Form */}
      <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        {hasAdvancedNodes(nodes) && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  This workflow contains advanced nodes that can only be edited in Canvas View. 
                  <button 
                    className="font-medium underline ml-1"
                    onClick={() => window.location.search = '?view=canvas'}
                  >
                    Switch to Canvas View
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
        {selectedNode ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {renderConfigForm(selectedNode)}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-xl font-medium text-gray-500">
              Select a configuration step from the left panel
            </h3>
            <p className="mt-2 text-gray-400">
              Or add a new step to get started
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 