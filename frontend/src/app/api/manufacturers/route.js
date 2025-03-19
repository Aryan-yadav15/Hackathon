import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'  // Replace createClient import

export async function GET() {
  // Add proper error handling for auth()
  try {
    // Properly await the auth() call
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { data: manufacturer, error } = await supabase
      .from('manufacturers')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      console.error('Error fetching manufacturer:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!manufacturer) {
      return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 });
    }

    return NextResponse.json(manufacturer);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  // Get auth info from Clerk with await
  const { userId } = await auth();
  
  // For debugging
  console.log('POST /api/manufacturers - User ID:', userId);
  
  // Check if user is authenticated
  if (!userId) {
    console.log('Authentication failed - no userId found');
    return NextResponse.json(
      { error: 'Unauthorized', details: 'You must be logged in' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    console.log('Request body:', body); // Debug the request body
    
    const { company_name } = body;
    
    // Validate request body
    if (!company_name) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Company name is required' },
        { status: 400 }
      );
    }

    // Use the already imported supabase client - don't create a new one
    // Check if company name already exists
    const { data: existingManufacturer, error: checkError } = await supabase
      .from('manufacturers')
      .select('id')
      .eq('clerk_id', userId.toString())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking company name:', checkError);
      return NextResponse.json(
        { error: 'Database Error', details: checkError.message },
        { status: 500 }
      );
    }

    if (existingManufacturer) {
      return NextResponse.json(
        { error: 'Conflict', details: 'Company name already exists' },
        { status: 409 }
      );
    }

    // Get user email from the request
    const userEmail = body.email;

    // Insert new manufacturer
    const { data, error } = await supabase.from('manufacturers').insert([
      {
        company_name: company_name,
        email: userEmail || 'placeholder@example.com',
        clerk_id: userId.toString(),
        is_active: true
      }
    ]).select();

    if (error) {
      console.error('Error creating manufacturer:', error);
      return NextResponse.json(
        { error: 'Database Error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Server Error', details: error.message },
      { status: 500 }
    );
  }
} 