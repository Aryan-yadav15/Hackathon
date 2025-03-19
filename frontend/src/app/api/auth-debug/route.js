import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get auth info
    const { userId, sessionId } = await auth();
    
    // Full debug information
    let debugInfo = {
      userId,
      sessionId,
      hasAuth: !!userId,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(
        Object.entries(Object.getOwnPropertyDescriptors(Request.prototype))
          .filter(([key]) => key === 'headers')
          .map(([key, descriptor]) => [key, descriptor.get])
      )
    };
    
    // Try to get user info if userId exists
    if (userId) {
      try {
        const user = await clerkClient.users.getUser(userId);
        debugInfo.userInfo = {
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          created: user.createdAt
        };
      } catch (userErr) {
        debugInfo.userError = userErr.message;
      }
    }
    
    console.log('Auth Debug Info:', debugInfo);
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Auth Debug Error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    }, { status: 500 });
  }
} 