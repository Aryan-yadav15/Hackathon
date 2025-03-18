import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const email = searchParams.get("state");

    console.log("Received callback with:", { email, hasCode: !!code });

    if (!code) {
      console.error("No code received in callback");
      return NextResponse.redirect(
        new URL("/manufacturer/registration/error", request.url)
      );
    }

    // Add token exchange
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    // Log the full response for debugging
    const responseText = await tokenResponse.text();
    console.log("Token exchange response:", responseText);

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", responseText);
      throw new Error(`Failed to exchange code for tokens: ${responseText}`);
    }

    const tokens = JSON.parse(responseText);

    // Validate token response
    if (!tokens.access_token || !tokens.refresh_token) {
      console.error("Invalid token response:", tokens);
      throw new Error("Invalid token response - missing required tokens");
    }

    // Store actual tokens with better error handling
    const { data: insertedData, error: supabaseError } = await supabase
      .from("oauth_tokens")
      .upsert(
        [
          {
            email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_type: tokens.token_type,
            scope: tokens.scope,
            expires_in: tokens.expires_in,
          },
        ],
        {
          onConflict: "email",
          returning: "minimal",
        }
      );

    if (supabaseError) {
      console.error("Supabase storage error:", supabaseError);
      throw supabaseError;
    }

    return NextResponse.redirect(
      new URL("/manufacturer/registration/complete", request.url)
    );
  } catch (error) {
    console.error("Detailed OAuth callback error:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    return NextResponse.redirect(
      new URL("/manufacturer/registration/error", request.url)
    );
  }
}
