"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import Handlebars from "handlebars"

// We need to use the same rendering logic as the Design Editor preview
// to ensure consistency. Since we are storing the raw React code in the DB,
// we need to transpile it on the client side here as well.

export function JournalCustomRenderer({ code, data }: { code: string, data: any }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Listen for navigation messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'navigate' && event.data.href) {
        router.push(event.data.href)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router])

  useEffect(() => {
    if (iframeRef.current) {
        let renderedHtml = "";
        let error = null;

        try {
            // Compile the template locally using the imported Handlebars package
            const template = Handlebars.compile(code);
            renderedHtml = template(data);
            
            // Debug: Log papers data
            console.log("[CustomRenderer] Papers count:", data.papers?.length);
            console.log("[CustomRenderer] Papers data:", JSON.stringify(data.papers, null, 2));
            
            // Debug: Check rendered HTML for links
            const linkMatches = renderedHtml.match(/href="\/novel\/[^"]*"/g);
            console.log("[CustomRenderer] Found links:", linkMatches);
            
            // Check for empty or undefined ids
            if (data.papers) {
                data.papers.forEach((p: any, i: number) => {
                    if (!p.id) {
                        console.error(`[CustomRenderer] Paper ${i} has no id:`, p);
                    }
                });
            }
        } catch (e: any) {
            console.error("Handlebars compilation error:", e);
            error = e.message;
        }
        
        const runnerHtml = `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${data.name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${error ? `<div style="color:red; padding: 20px; border: 1px solid red; margin: 20px; border-radius: 4px; background: #fff0f0;">
            <h3>Template Error</h3>
            <pre>${error}</pre>
          </div>` : renderedHtml}
          <script>
            // Handle link clicks - open external links in new tab, internal links in parent
            document.addEventListener('click', function(e) {
              const link = e.target.closest('a[href]');
              if (link) {
                const href = link.getAttribute('href');
                // Skip empty href, anchor links, and javascript: links
                if (!href || href === '' || href === '#' || href.startsWith('#') || href.startsWith('javascript:')) {
                  return;
                }
                e.preventDefault();
                // Check if it's an external link
                if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
                  // External link - open in new tab
                  window.open(href, '_blank');
                } else {
                  // Internal link - use postMessage to notify parent window
                  // Parent window will handle the navigation
                  window.parent.postMessage({ type: 'navigate', href: href }, '*');
                }
              }
            });
          </script>
        </body>
        </html>`;

      const blob = new Blob([runnerHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      iframeRef.current.src = url
      return () => URL.revokeObjectURL(url)
    }
  }, [code, data])

  return (
    <div className="w-full min-h-screen bg-white">
      <iframe
        ref={iframeRef}
        className="w-full h-screen border-none"
        title="Journal Custom Homepage"
        // SECURITY: allow-top-navigation is needed for internal links to work
        // allow-same-origin is intentionally omitted for security
        sandbox="allow-scripts allow-popups allow-forms allow-top-navigation"
      />
    </div>
  )
}
