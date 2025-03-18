import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    try {
      // First get the manufacturer id for this clerk user
      const { data: manufacturer, error: manufacturerError } = await supabase
        .from('manufacturers')
        .select('id')
        .eq('clerk_id', userId)
        .single()

      if (manufacturerError) {
        console.error('Manufacturer error:', manufacturerError)
        return new NextResponse(
          JSON.stringify({ error: 'Failed to fetch manufacturer' }), 
          { status: 500 }
        )
      }

      if (!manufacturer) {
        return new NextResponse(
          JSON.stringify({ error: 'Manufacturer not found' }), 
          { status: 404 }
        )
      }

      // Get the manufacturer's workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select(`
          *,
          workflow_nodes(*),
          workflow_edges(*)
        `)
        .eq('manufacturer_id', manufacturer.id)
        .single()

      if (workflowError && workflowError.code !== 'PGRST116') { // Ignore "not found" error
        console.error('Workflow error:', workflowError)
        return new NextResponse(
          JSON.stringify({ error: 'Failed to fetch workflow' }), 
          { status: 500 }
        )
      }

      return NextResponse.json(workflow || { workflow_nodes: [], workflow_edges: [] })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return new NextResponse(
        JSON.stringify({ error: 'Database operation failed' }), 
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in workflow route:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { status: 500 }
    )
  }
}

// Helper function to clean node data
const cleanNodeData = (node) => {
  // Log the raw node data first
  console.log('Cleaning node data:', node);
  
  if (node.type === 'product' && node.data) {
    console.log('Processing product node data:', node.data);
    
    // If we have productIds property
    if (node.data.productIds) {
      console.log('Original productIds:', node.data.productIds);
      
      // Process each product ID
      node.data.productIds = node.data.productIds.map(id => {
        // If it's a string that contains letters (like "product-123")
        if (typeof id === 'string' && id.match(/[a-zA-Z]/)) {
          // Try to extract just the numeric part
          const matches = id.match(/\d+/);
          if (matches && matches[0]) {
            console.log(`Converting ${id} to ${parseInt(matches[0], 10)}`);
            return parseInt(matches[0], 10);
          }
        }
        
        // If it's already a numeric string, convert to number
        if (typeof id === 'string' && !isNaN(id)) {
          console.log(`Converting string ${id} to number ${parseInt(id, 10)}`);
          return parseInt(id, 10);
        }
        
        // If it's already a number, keep it
        if (typeof id === 'number') {
          return id;
        }
        
        // If all else fails, log the unexpected ID format
        console.warn('Unexpected ID format:', id);
        return null;
      })
      .filter(id => id !== null); // Remove any null IDs
      
      console.log('Processed productIds:', node.data.productIds);
    }
    
    // Remove any full product objects if they exist (we only want IDs)
    if (node.data.products) {
      console.log('Removing full products array');
      delete node.data.products;
    }
  }
  
  return node;
};

export async function POST(request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Get manufacturer id first
    const { data: manufacturer, error: manufacturerError } = await supabase
      .from('manufacturers')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (manufacturerError) {
      console.error('Manufacturer error:', manufacturerError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch manufacturer' }), 
        { status: 500 }
      )
    }

    if (!manufacturer) {
      return new NextResponse(
        JSON.stringify({ error: 'Manufacturer not found' }), 
        { status: 404 }
      )
    }

    const { workflow_nodes, workflow_edges, is_valid } = await request.json()
    console.log('Received workflow data:', { 
      nodes_count: workflow_nodes.length,
      edges_count: workflow_edges.length,
      is_valid
    })
    
    // Log sample node for debugging
    if (workflow_nodes.length > 0) {
      console.log('Sample node data:', workflow_nodes[0]);
    }

    // Delete existing workflow if any
    const { data: existingWorkflow } = await supabase
      .from('workflows')
      .select('id')
      .eq('manufacturer_id', manufacturer.id)
      .single()

    if (existingWorkflow) {
      await supabase
        .from('workflow_edges')
        .delete()
        .eq('workflow_id', existingWorkflow.id)

      await supabase
        .from('workflow_nodes')
        .delete()
        .eq('workflow_id', existingWorkflow.id)

      await supabase
        .from('workflows')
        .delete()
        .eq('id', existingWorkflow.id)
    }

    // Clean all node data before saving
    const cleanedNodes = workflow_nodes.map(cleanNodeData);
    
    // When inserting into the database, log the exact insert data
    console.log('About to insert workflow with nodes:', cleanedNodes);
    
    // Use the cleaned nodes for database operations
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .insert({
        manufacturer_id: manufacturer.id,
        name: 'Default Workflow',
        is_active: true,
        nodes: cleanedNodes
      })
      .select()
      .single()

    if (workflowError) throw workflowError
    console.log('Created workflow:', workflow)

    let savedNodes = []
    let savedEdges = []

    // Save nodes with workflow_id
    if (workflow_nodes && workflow_nodes.length > 0) {
      const { data: nodes, error: nodesError } = await supabase
        .from('workflow_nodes')
        .insert(cleanedNodes)
        .select()

      if (nodesError) throw nodesError
      savedNodes = nodes
      console.log('Saved nodes:', savedNodes)
    }

    // Save edges with workflow_id
    if (workflow_edges && workflow_edges.length > 0) {
      // Create a map of frontend node IDs to database node IDs
      const nodeIdMap = new Map()
      savedNodes.forEach((node, index) => {
        nodeIdMap.set(workflow_nodes[index].id, node.id)
      })

      console.log('Node ID mapping:', Object.fromEntries(nodeIdMap))
      console.log('Edges to save:', workflow_edges)

      const edgesToSave = workflow_edges.map(edge => {
        const sourceId = nodeIdMap.get(edge.source)
        const targetId = nodeIdMap.get(edge.target)
        
        console.log(`Mapping edge: ${edge.source} -> ${sourceId}, ${edge.target} -> ${targetId}`)
        
        return {
          workflow_id: workflow.id,
          source_node_id: sourceId,
          target_node_id: targetId
        }
      })

      console.log('Prepared edges:', edgesToSave)

      const { data: edges, error: edgesError } = await supabase
        .from('workflow_edges')
        .insert(edgesToSave)
        .select()

      if (edgesError) {
        console.error('Edge save error:', edgesError)
        throw edgesError
      }

      savedEdges = edges
      console.log('Saved edges:', savedEdges)
    }

    const result = {
      workflow,
      workflow_nodes: savedNodes,
      workflow_edges: savedEdges
    }
    console.log('Returning result:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error saving workflow:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: error.message || 'Internal Server Error',
        details: error
      }), 
      { 
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function DELETE(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Get manufacturer id first
    const { data: manufacturer, error: manufacturerError } = await supabase
      .from('manufacturers')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (manufacturerError) {
      console.error('Manufacturer error:', manufacturerError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch manufacturer' }), 
        { status: 500 }
      )
    }

    // Get the workflow to delete
    const { data: workflow } = await supabase
      .from('workflows')
      .select('id')
      .eq('manufacturer_id', manufacturer.id)
      .single()

    if (workflow) {
      // Delete in order: edges -> nodes -> workflow
      const { error: edgesError } = await supabase
        .from('workflow_edges')
        .delete()
        .eq('workflow_id', workflow.id)

      if (edgesError) {
        console.error('Error deleting edges:', edgesError)
        throw edgesError
      }

      const { error: nodesError } = await supabase
        .from('workflow_nodes')
        .delete()
        .eq('workflow_id', workflow.id)

      if (nodesError) {
        console.error('Error deleting nodes:', nodesError)
        throw nodesError
      }

      const { error: workflowError } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflow.id)

      if (workflowError) {
        console.error('Error deleting workflow:', workflowError)
        throw workflowError
      }

      return new NextResponse(
        JSON.stringify({ message: 'Workflow deleted successfully' }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return new NextResponse(
      JSON.stringify({ message: 'No workflow found to delete' }), 
      { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: error.message || 'Internal Server Error',
        details: error
      }), 
      { 
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 