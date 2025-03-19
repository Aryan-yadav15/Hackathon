import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    console.log("Received callback with:", { state, hasCode: !!code });

    if (!code) {
      console.error("No code received in callback");
      return NextResponse.redirect(new URL("/manufacturer/registration/error", request.nextUrl.origin));
    }

    // Construct the token exchange request body
    const tokenRequestBody = new URLSearchParams({
      code,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    // Token exchange
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenRequestBody,
    });

    const responseText = await tokenResponse.text();
    console.log("Token exchange response:", responseText);

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", responseText);
      return NextResponse.redirect(new URL("/manufacturer/registration/error", request.nextUrl.origin));
    }

    const tokens = JSON.parse(responseText);

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error("Invalid token response:", tokens);
      return NextResponse.redirect(new URL("/manufacturer/registration/error", request.nextUrl.origin));
    }

    // Assuming 'state' contains the email (as per your original code's intent)
    if (!state) {
      console.error("No state (email) received in callback");
      return NextResponse.redirect(new URL("/manufacturer/registration/error", request.nextUrl.origin));
    }

    const { data, error } = await supabase.from('manufacturers')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
      })
      .eq('email', state)
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.redirect(new URL("/manufacturer/registration/error", request.nextUrl.origin));
    }

    if (!data || data.length === 0) {
      console.error("No manufacturer found with email:", state);
      return NextResponse.redirect(new URL("/manufacturer/registration/error", request.nextUrl.origin));
    }

    // Redirect to success page
    return NextResponse.redirect(new URL("/manufacturer/registration/success", request.nextUrl.origin));

  } catch (error) {
    console.error("Detailed OAuth callback error:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    return NextResponse.redirect(new URL("/manufacturer/registration/error", request.nextUrl.origin));
  }
}
