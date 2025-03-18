import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Initialize Supabase directly as in your manufacturers route
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const manufacturerId = searchParams.get('manufacturer_id')
    const ids = searchParams.get('ids')
    
    // Query based on parameters
    let query = supabase.from('products').select('*')
    
    if (ids) {
      // Split the IDs string into an array of IDs
      const idArray = ids.split(',').map(id => parseInt(id.trim(), 10))
      console.log('Fetching products with IDs:', idArray)
      
      // Filter by the array of IDs
      query = query.in('id', idArray)
    } else if (manufacturerId) {
      // If manufacturer ID is provided, fetch all products for that manufacturer
      query = query.eq('manufacturer_id', manufacturerId)
    } else {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }
    
    // Execute the query
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse the request body
    const body = await request.json()
    
    // Get manufacturer directly instead of requiring manufacturer_id in the request
    const { data: manufacturer, error: manufacturerError } = await supabase
      .from('manufacturers')
      .select('id')
      .eq('clerk_id', userId)
      .single()
      
    if (manufacturerError) {
      console.error('Manufacturer lookup error:', manufacturerError)
      return NextResponse.json({ error: 'Failed to identify manufacturer' }, { status: 500 })
    }
    
    if (!manufacturer) {
      return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 })
    }
    
    // Validate other required fields (removing manufacturer_id requirement)
    if (!body.name || !body.sku || !body.price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Insert the product using the manufacturer ID from the auth lookup
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: body.name,
        sku: body.sku,
        price: body.price,
        manufacturer_id: manufacturer.id // Use the verified manufacturer ID
      }])
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 