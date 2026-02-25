import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    // 1. Fetch the target URL server-side
    const response = await fetch(url, {
      headers: {
        // Pretend to be a real browser to avoid some basic bot detection
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    // 2. Prepare headers for the proxy response
    const headers = new Headers();
    // Allow embedding
    headers.set('X-Frame-Options', 'ALLOWALL'); 
    headers.set('Content-Security-Policy', "frame-ancestors *;");
    headers.set('Access-Control-Allow-Origin', '*');
    
    // Copy content type
    if (contentType) headers.set('Content-Type', contentType);

    // 3. If it's HTML, we need to inject <base> tag to fix relative links (images, css, etc.)
    if (isHtml) {
      const text = await response.text();
      
      // Determine base URL (origin + path)
      const urlObj = new URL(url);
      const baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
      
      // Inject <base> tag right after <head>
      // Also try to remove CSP meta tags if they exist in HTML
      const modifiedHtml = text
        .replace('<head>', `<head><base href="${baseUrl}">`)
        .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/gi, '')
        .replace(/<meta http-equiv="X-Frame-Options"[^>]*>/gi, '');

      return new NextResponse(modifiedHtml, { headers });
    } else {
      // For non-HTML assets (images, css, etc.), just pipe the stream
      return new NextResponse(response.body, { headers });
    }

  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(`Error fetching URL: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}
