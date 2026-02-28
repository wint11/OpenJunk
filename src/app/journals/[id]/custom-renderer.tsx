"use client"

import { useEffect, useRef } from "react"

import Handlebars from "handlebars"

// We need to use the same rendering logic as the Design Editor preview
// to ensure consistency. Since we are storing the raw React code in the DB,
// we need to transpile it on the client side here as well.

export function JournalCustomRenderer({ code, data }: { code: string, data: any }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current) {
        let renderedHtml = "";
        let error = null;

        try {
            // Compile the template locally using the imported Handlebars package
            const template = Handlebars.compile(code);
            renderedHtml = template(data);
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
        // SECURITY: REMOVED 'allow-same-origin' to prevent XSS attacks accessing parent window/cookies
        // We only allow scripts to run for UI logic (Tailwind, animations), but isolated from the main app context.
        sandbox="allow-scripts allow-popups allow-forms"
      />
    </div>
  )
}
