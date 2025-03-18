import { clerkMiddleware } from '@clerk/nextjs/server'

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default clerkMiddleware({
  // Add your public routes
  publicRoutes: [
    '/',
    '/sign-in',
    '/sign-up'
  ],
  // Protect all other routes by default
  ignoredRoutes: [
    '/((?!api|trpc))(_next|.+\\.[\\w]+$)', // Ignore static files
    '/api/uipath/webhook'  // Ignore webhook endpoints
  ]
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/',
    '/(api|trpc)(.*)'
  ],
} 