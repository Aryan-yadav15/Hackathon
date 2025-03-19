import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { createClient } from '@supabase/supabase-js';

// Force response to be proper Next.js response
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Debug Supabase connection
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);

export async function GET(request) {
  try {
    // TEST - remove after debugging
    console.log("OAUTH TEST - HANDLER EXECUTION");
    
    // Test if basic response works
    const testResponse = new NextResponse(
      JSON.stringify({ test: true, message: "This is a test response" }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log("Created test response:", testResponse);
    
    // DEBUG - Check if URL parameters exist
    const url = new URL(request.url);
    console.log("Raw request URL:", request.url);
    console.log("Parsed URL search params:", url.searchParams.toString());
    
    // Continue with normal flow
    console.log("🔍 OAuth2Callback received request");
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    
    console.log("📌 OAuth params:", { 
      codeReceived: !!code, 
      errorReceived: !!error, 
      stateReceived: !!state,
      fullState: state
    });

    // Check for OAuth error response
    if (error) {
      console.error("OAuth error received:", error);
      return new NextResponse(JSON.stringify({
        error: true,
        message: `OAuth error: ${error}`,
        details: Object.fromEntries(searchParams.entries())
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!code) {
      console.error("No code received in callback");
      return new NextResponse(JSON.stringify({
        error: true,
        message: "No authorization code received",
        params: Object.fromEntries(searchParams.entries())
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Capture details for debugging
    const debugInfo = {
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI,
      code_received: !!code,
      state_received: state
    };
    console.log("OAuth debug info:", debugInfo);

    // Construct the token exchange request body
    const tokenRequestBody = new URLSearchParams({
      code,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    // Exchange authorization code for tokens
    console.log("🔄 Attempting to exchange code for tokens");
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenRequestBody,
    });
    
    const tokenData = await tokenResponse.json();
    console.log("📊 Token exchange response status:", tokenResponse.status);
    console.log("📦 Token data received:", { 
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenData);
      
      // Redirect to error page instead of returning JSON
      const errorUrl = new URL("/manufacturer/registration/error", request.nextUrl.origin);
      errorUrl.searchParams.set('reason', 'token_exchange');
      errorUrl.searchParams.set('status', tokenResponse.status);
      return NextResponse.redirect(errorUrl);
    }

    const tokens = tokenData;

    if (!tokens.access_token) {
      console.error("Invalid token response:", tokens);
      return new NextResponse(JSON.stringify({
        error: true,
        message: "Invalid token response - missing access token",
        tokens
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create a temporary success response even without database operation
    let databaseSuccess = false;
    
    // Try to update the manufacturer record with the tokens
    if (state) {
      try {
        // Decode state if it's a JSON string (likely email)  
        const decodedState = decodeURIComponent(state);
        let email;
        
        try {
          const stateObj = JSON.parse(decodedState);
          email = stateObj.email;
          console.log("📧 Extracted email from state:", email);
        } catch (err) {
          // If not JSON, assume it's just the email
          email = decodedState;
          console.log("📧 Using state directly as email:", email);
        }
        
        if (email) {
          const { data, error } = await supabase
            .from('oauth_tokens')
            .upsert({
              email: email,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              token_type: tokens.token_type,
              scope: tokens.scope || "",
              expires_in: tokens.expires_in,
              created_at: new Date().toISOString()
            });
          
          if (error) {
            console.error('Error storing OAuth tokens:', error);
          } else {
            console.log('✅ Successfully stored OAuth tokens');
            databaseSuccess = true;
          }
        }
      } catch (err) {
        console.error('Error processing state or updating manufacturer:', err);
      }
    }
    
    // Redirect with success info 
    const successUrl = new URL("/manufacturer/registration/success", request.nextUrl.origin);
    successUrl.searchParams.set('authStatus', 'complete');
    return NextResponse.redirect(successUrl);
    
  } catch (error) {
    console.error("Detailed OAuth callback error:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    
    // Fall back to simple text response if redirect fails
    try {
      // Redirect to error page
      return NextResponse.redirect(new URL("/manufacturer/registration/error", request.nextUrl.origin));
    } catch (redirectError) {
      console.error("Failed to redirect after error:", redirectError);
      
      // Absolute fallback - just return a simple response
      return new NextResponse(
        JSON.stringify({ 
          error: true, 
          message: "Authentication failed", 
          originalError: error.message 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}
