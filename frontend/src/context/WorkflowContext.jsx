'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const WorkflowContext = createContext();

// Export the provider component
export function WorkflowProvider({ children }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  
  // Auto-open modal when a node is selected
  useEffect(() => {
    if (selectedNode) {
      setIsNodeModalOpen(true);
    }
  }, [selectedNode]);
  
  // Close modal and clear selection
  const closeNodeModal = () => {
    setIsNodeModalOpen(false);
    setSelectedNode(null);
  };

  const value = {
    selectedNode,
    setSelectedNode,
    isNodeModalOpen,
    setIsNodeModalOpen,
    closeNodeModal,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}

// Export the hook
export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
} 