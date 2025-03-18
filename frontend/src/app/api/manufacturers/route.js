import { currentUser } from "@clerk/nextjs/server"
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

// Create Supabase client inside the API route
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      console.log('Auth failed:', { user: !!user });
      return Response.json({ error: 'Unauthorized', details: 'No user found' }, { status: 401 });
    }

    const { data: manufacturer, error } = await supabase
      .from('manufacturers')
      .select('*')
      .eq('clerk_id', user.id)
      .single();

    if (error) throw error;

    return Response.json(manufacturer || null);
  } catch (error) {
    console.error('Manufacturers GET error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  const { userId } = auth()
  
  if (!userId) {
    console.log('Auth failed on POST:', { user: !!userId });
    return Response.json({ error: 'Unauthorized', details: 'No user found' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Check if manufacturer already exists
    const { data: existingManufacturer } = await supabase
      .from('manufacturers')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (existingManufacturer) {
      return Response.json({ error: 'Manufacturer already exists' }, { status: 400 });
    }

    // Create new manufacturer
    const { data: manufacturer, error } = await supabase
      .from('manufacturers')
      .insert([{
        clerk_id: userId,
        company_name: body.company_name || userId,
        email: userId + '@example.com',
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return Response.json(manufacturer);
  } catch (error) {
    console.error('Manufacturers POST error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
} 