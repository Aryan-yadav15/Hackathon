'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  Panel,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Sidebar from "./Sidebar"
import { FaEnvelope, FaBox, FaExclamationTriangle, FaFileInvoiceDollar, FaCodeBranch, FaPercentage, FaBell } from 'react-icons/fa'
import { CheckCircle2, Trash2 } from 'lucide-react'
import WorkflowGuide from './WorkflowGuide'
import { retailerGroupWorkflow } from './DemoWorkflow'
import CustomNode from './CustomNode'
import WorkflowNode from './WorkflowNode'
import FlowEdge from './FlowEdge'
import ConnectionLine from './ConnectionLine'
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"

const sidebarNodeTypes = [
  {
    type: 'email',
    label: 'Email Configuration',
    description: 'Configure email tracking settings',
    icon: <FaEnvelope className="w-6 h-6 text-blue-500" />,
    color: 'border-blue-500',
    order: 1,
    canConnect: ['product', 'conditional'],
    badge: 'Start Here'
  },
  {
    type: 'product',
    label: 'Product List',
    description: 'Add products to track',
    icon: <FaBox className="w-6 h-6 text-green-500" />,
    color: 'border-green-500',
    order: 2,
    canConnect: ['exception', 'invoice', 'conditional', 'price_adjustment'],
    badge: 'Step 2'
  },
  {
    type: 'exception',
    label: 'Exception Products',
    description: 'Configure product exceptions',
    icon: <FaExclamationTriangle className="w-6 h-6 text-yellow-500" />,
    color: 'border-yellow-500',
    order: 3,
    canConnect: ['invoice', 'conditional']
  },
  {
    type: 'invoice',
    label: 'Invoice Template',
    description: 'Design invoice layout',
    icon: <FaFileInvoiceDollar className="w-6 h-6 text-purple-500" />,
    color: 'border-purple-500',
    order: 4,
    canConnect: []
  },
  {
    type: 'conditional',
    label: 'Conditional Logic',
    description: 'Add if/then branching logic',
    icon: <FaCodeBranch className="w-6 h-6 text-orange-500" />,
    color: 'border-orange-500',
    order: 5,
    canConnect: ['email', 'product', 'exception', 'invoice', 'price_adjustment', 'notification']
  },
  {
    type: 'price_adjustment',
    label: 'Price Adjustment',
    description: 'Modify pricing for products',
    icon: <FaPercentage className="w-6 h-6 text-pink-500" />,
    color: 'border-pink-500',
    order: 6,
    canConnect: ['invoice']
  },
  {
    type: 'notification',
    label: 'Notification',
    description: 'Send alerts and notifications',
    icon: <FaBell className="w-6 h-6 text-indigo-500" />,
    color: 'border-indigo-500',
    order: 7,
    canConnect: ['invoice', 'conditional']
  }
];

// Define node types
const nodeTypes = {
  customNode: CustomNode,
  workflowNode: WorkflowNode
};

// Define edge types
const edgeTypes = {
  custom: FlowEdge
};

// Initial blank slate
const initialNodes = [];
const initialEdges = [];

export default function CanvasView() {
  // References and state
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [guideVisible, setGuideVisible] = useState(nodes.length === 0);
  const [view, setView] = useState('canvas'); // Add view state

  // Handler for loading demo workflow
  const handleLoadDemoWorkflow = useCallback((workflow) => {
    if (workflow && workflow.nodes && workflow.edges) {
      // Clear existing workflow
      setNodes([]);
      setEdges([]);
      
      // Slight delay to ensure clear happens first
      setTimeout(() => {
        // Load new workflow
        setNodes(workflow.nodes);
        setEdges(workflow.edges);
        setGuideVisible(false);
        
        // Notify user
        toast({
          title: "Retailer Group Workflow Loaded",
          description: "The retailer group-based order processing workflow has been loaded successfully.",
          variant: "default",
        });
        
        // Fit view to see all nodes
        if (reactFlowInstance) {
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2 });
          }, 100);
        }
      }, 50);
    }
  }, [reactFlowInstance, setNodes, setEdges]);
  
  // Handler for when nodes are dropped onto the canvas
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handler for when dropped node is released
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      // Hide guide when first node is added
      if (nodes.length === 0) {
        setGuideVisible(false);
      }
      
      // Get the data from the drag source
      const nodeData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      
      // Check if there's node data and type
      if (!nodeData || !nodeData.type) {
        return;
      }
      
      // Get position in the canvas where the node was dropped
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Create a new unique ID for the node
      const id = `${nodeData.type}-${nodes.length + 1}`;
      
      // Create the new node
      const newNode = {
        id,
        type: 'customNode',
        position,
        data: { 
          ...nodeData,
          configured: false, 
          label: nodeData.type.charAt(0).toUpperCase() + nodeData.type.slice(1),
          manufacturer_id: '1'
        },
      };
      
      // Add the new node to the canvas
      setNodes((nds) => nds.concat(newNode));
      
      // Toast notification
      toast({
        title: "Node Added",
        description: `Added a new ${nodeData.type} node to the canvas.`,
        variant: "default",
      });
    },
    [reactFlowInstance, nodes, setNodes]
  );
  
  // Handler for when a new connection is made between nodes
  const onConnect = useCallback(
    (params) => {
      // Default edge settings
      const edge = {
        ...params,
        type: 'custom',
        animated: true,
        style: { stroke: '#555' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      
      setEdges((eds) => addEdge(edge, eds));
      
      toast({
        title: "Connection Created",
        description: "You've connected two nodes together.",
        variant: "default",
      });
    },
    [setEdges]
  );
  
  // Node dragging handlers
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };
  
  // Show guide when there are no nodes
  useEffect(() => {
    if (nodes.length === 0) {
      setGuideVisible(true);
    }
  }, [nodes]);

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setGuideVisible(true);
    toast({
      title: "Canvas Cleared",
      description: "All nodes and connections have been removed.",
      variant: "destructive"
    });
  }, [setNodes, setEdges, setGuideVisible]);

  return (
    <div className="flex h-full w-full bg-gray-50 dark:bg-gray-900">
      <div className="flex grow flex-col relative">
        <ReactFlowProvider>
          <div className="reactflow-wrapper h-full w-full" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionLineComponent={ConnectionLine}
              fitView
              attributionPosition="bottom-right"
              minZoom={0.2}
              deleteKeyCode="Delete"
            >
              <Background size={1} color="#ddd" />
              <Controls />
              
              <Panel position="top-right" className="space-x-2">
                <div className="flex items-center border rounded-md overflow-hidden shadow-md">
                  <button
                    onClick={() => setView('canvas')}
                    className={`px-4 py-2 text-sm font-medium ${view === 'canvas' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Canvas
                  </button>
                  <button
                    onClick={() => setView('form')}
                    className={`px-4 py-2 text-sm font-medium ${view === 'form' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Form
                  </button>
                </div>
                <Button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear the canvas? This will remove all nodes and connections.')) {
                      clearCanvas();
                    }
                  }}
                  variant="destructive"
                  size="sm"
                  className="shadow-md"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Canvas
                </Button>
                <Button size="sm" className="shadow-md">Save Workflow</Button>
              </Panel>

              {/* Guide overlay when no nodes are present */}
              {guideVisible && <WorkflowGuide />}
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </div>
      
      {/* Sidebar with nodes and demo */}
      <Sidebar 
        onDragStart={onDragStart} 
        onLoadDemoWorkflow={() => {
          // Simply load the retailer group workflow that's directly imported
          handleLoadDemoWorkflow(retailerGroupWorkflow);
        }}
      />
    </div>
  )
} 