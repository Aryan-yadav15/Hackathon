import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    // Get email from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' }, 
        { status: 400 }
      );
    }

    // Get latest tokens for this email
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve tokens' },
        { status: 500 }
      );
    }

    // Check if we got any results
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No tokens found for this email' },
        { status: 404 }
      );
    }

    const tokenData = data[0];  // Get the first (most recent) row

    // Check if token is expired
    const expiresInMs = tokenData.expires_in ? tokenData.expires_in * 1000 : 0; // Convert expires_in (seconds) to milliseconds
    const expiryTime = new Date(tokenData.created_at).getTime() + expiresInMs;

    if (expiresInMs > 0 && Date.now() >= expiryTime) {
      console.warn(`Token for ${email} has expired.`);
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 401 }
      );
    }

    // Return valid tokens
    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      email: tokenData.email,
      token_type: tokenData.token_type || 'Bearer',
      scope: tokenData.scope || '',
      expires_in: expiresInMs / 1000 // Return in seconds
    });

  } catch (error) {
    console.error('Unexpected error in gettokens:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}