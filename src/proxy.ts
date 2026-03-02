import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

// Simple in-memory rate limiter (not suitable for distributed/serverless, good for demo)
// const rateLimit = new Map<string, { count: number; lastReset: number }>();
// const WINDOW_SIZE = 60 * 1000; // 1 minute
// const MAX_REQUESTS = 100; // 100 requests per minute

export function proxy(request: NextRequest, event: NextFetchEvent) {
  // Maintenance Configuration
  // Adjust these dates as needed
  const MAINTENANCE_START = new Date('2026-03-03T18:00:00')
  const MAINTENANCE_END = new Date('2026-03-06T00:00:00')
  const MAINTENANCE_PATH = '/maintenance'
  
  const now = new Date()
  const isMaintenanceMode = now >= MAINTENANCE_START && now <= MAINTENANCE_END
  const { pathname } = request.nextUrl

  // Check maintenance mode first
  // Allow static files, api routes (maybe?), and images
  const isStaticOrApi = 
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/auth') || 
    pathname.includes('.')

  if (!isStaticOrApi) {
    // If in maintenance mode
    if (isMaintenanceMode) {
      // If not already on maintenance page, redirect
      if (pathname !== MAINTENANCE_PATH) {
        return NextResponse.redirect(new URL(MAINTENANCE_PATH, request.url))
      }
    } else {
      // If NOT in maintenance mode but user tries to access maintenance page
      if (pathname === MAINTENANCE_PATH) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const path = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const response = NextResponse.next();

  // Logging
  const logData = {
    timestamp: new Date().toISOString(),
    method,
    url: path + search,
    ip,
    userAgent,
    status: response.status // Capture status from the response object
  };

  // Asynchronously log the request
  event.waitUntil(
    fetch(new URL('/api/log', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(err => console.error('Log fetch failed', err))
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/log (logging endpoint to avoid infinite loops)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/log).*)',
  ],
}
