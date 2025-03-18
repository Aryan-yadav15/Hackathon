import React, { useEffect } from 'react'
import { useWorkflow } from '../../contexts/WorkflowContext'

export default function BaseNode({ id, data, type, selected }) {
  const { setSelectedNode } = useWorkflow()
  
  // Ensure we handle clicks properly to open modals
  const handleNodeClick = (e) => {
    e.stopPropagation() // Prevent click from bubbling to canvas
    setSelectedNode({ id, type, data })
  }
  
  return (
    <div 
      className={`node ${selected ? 'selected' : ''}`}
      onClick={handleNodeClick}
    >
      {/* Node content */}
      <div className="node-header">
        <div className="node-icon">
          {getNodeIcon(type)}
        </div>
        <div className="node-title">{getNodeTitle(type)}</div>
      </div>
      
      {/* Node content specific to type */}
      <div className="node-content">
        {renderNodeContent(type, data)}
      </div>
    </div>
  )
} 