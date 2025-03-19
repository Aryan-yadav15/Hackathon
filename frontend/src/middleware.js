import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/uipath/webhook(.*)',
    '/api/oauth2callback(.*)',
    '/api/gettokens(.*)',
    '/manufacturer/registration/(.*)'
  ],
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/(.*)'
  ],
}; 