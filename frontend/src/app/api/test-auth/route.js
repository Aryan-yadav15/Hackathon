import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  console.log('Test auth userId:', userId);
  
  return NextResponse.json({ 
    userId: userId || null,
    authenticated: !!userId
  });
} 