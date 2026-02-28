"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, Save, RefreshCw, Smartphone, Tablet, Monitor, Code, Eye, Maximize, Undo, Redo, XCircle } from "lucide-react"
import { toast } from "sonner"
import { saveDesign, generateDesign } from "./actions"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Handlebars from "handlebars"

// Dynamic import for Monaco Editor to avoid SSR issues
import { loader } from "@monaco-editor/react"

// Configure Monaco to use local resources
// Note: We need to copy monaco-editor files to public directory or use a CDN
// For simplicity in this specific environment, we'll use jsdelivr but we MUST allow it in CSP
// We've updated next.config.ts to allow cdn.jsdelivr.net

const Editor = dynamic(() => import("@monaco-editor/react"), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-[#1e1e1e] flex items-center justify-center text-muted-foreground">Loading Editor...</div>
})

// Use the default template file content as the base
// const DEFAULT_REACT_TEMPLATE = ... (Removed hardcoded template)

interface JournalData {
    name: string
    description: string | null
    paperCount: number
    adminCount: number
    createdAt: string
    guidelines: string | null
    guidelinesUrl: string | null
    papers: {
        id: string
        title: string
        description: string
        author: string
        date: string
        category: string
    }[]
}

interface DesignEditorProps {
  journalId: string
  initialConfig?: string
  defaultTemplate: string
  journalData: JournalData
}

export function DesignEditor({ journalId, initialConfig, defaultTemplate, journalData }: DesignEditorProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  // Default to the React template passed from server, but ensure we use defaultTemplate if initialConfig is empty string
  const [code, setCode] = useState(() => initialConfig && initialConfig.trim() !== "" ? initialConfig : defaultTemplate)
  
  // History State
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useEffect(() => {
    setMounted(true)
    if (history.length === 0) {
      setHistory([initialConfig && initialConfig.trim() !== "" ? initialConfig : defaultTemplate])
      setHistoryIndex(0)
    }
  }, [])

  const [activeTab, setActiveTab] = useState("preview")
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("desktop")
  
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Construct the Preview Runner HTML
  // This HTML will load Tailwind and render the pre-compiled HTML
  const getRunnerHtml = useCallback((userCode: string, data: JournalData) => {
    let renderedHtml = "";
    let error = null;

    try {
        // Compile the template locally using the imported Handlebars package
        const template = Handlebars.compile(userCode);
        renderedHtml = template(data);
    } catch (e: any) {
        console.error("Handlebars compilation error:", e);
        error = e.message;
    }
    
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Preview</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
      ${error ? `<div style="color:red; padding: 20px; border: 1px solid red; margin: 20px; border-radius: 4px; background: #fff0f0;">
        <h3>Template Error</h3>
        <pre>${error}</pre>
      </div>` : renderedHtml}
    </body>
    </html>`;
  }, []);

  // Update preview when code changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        // Create a blob URL to bypass some CSP restrictions that might block srcdoc inline scripts
        // and allow better error handling
        const html = getRunnerHtml(code, journalData)
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        
        iframeRef.current.src = url
        
        // Cleanup function to revoke object URL
        return () => URL.revokeObjectURL(url)
      }
    }, 800) // Slightly longer debounce for compilation

    return () => clearTimeout(timer)
  }, [code, journalData, getRunnerHtml])

  // Initial load
  useEffect(() => {
    if (iframeRef.current && mounted) {
        const html = getRunnerHtml(code, journalData)
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        
        iframeRef.current.src = url
        
        // Cleanup function to revoke object URL
        return () => URL.revokeObjectURL(url)
    }
  }, [mounted, journalData, getRunnerHtml]) 

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await saveDesign(journalId, code)
      if (result.success) {
        toast.success("Saved successfully")
        router.push("/admin/journals")
      } else {
        toast.error("Failed to save")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRestoreDefault = async () => {
    if (confirm("This will remove your custom design and revert the journal to the system default style. Are you sure?")) {
      setIsSaving(true)
      try {
        const result = await saveDesign(journalId, null)
        if (result.success) {
          toast.success("Restored to default style")
          router.push("/admin/journals")
        } else {
          toast.error("Failed to restore")
        }
      } catch (error) {
        toast.error("An error occurred")
      } finally {
        setIsSaving(false)
      }
    }
  }

  const pushToHistory = useCallback((newCode: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newCode)
      return newHistory
    })
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      setHistoryIndex(prevIndex)
      setCode(history[prevIndex])
      toast.info("Undone")
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      setCode(history[nextIndex])
      toast.info("Redone")
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return
    setIsLoading(true)
    
    try {
      if (code !== history[historyIndex]) {
          pushToHistory(code)
      }

      const prompt = input
      setInput("") 
      
      // We are now sending REACT code to the AI
      const result = await generateDesign(prompt, code)
      
      if (result.success && result.code) {
        setCode(result.code)
        pushToHistory(result.code)
        toast.success("Code updated by AI")
      } else {
        toast.error("AI failed to generate code: " + (result.error || "Unknown error"))
      }
    } catch (error) {
      console.error("AI Request Failed:", error)
      toast.error("Failed to communicate with AI")
    } finally {
      setIsLoading(false)
    }
  }

  const getDeviceWidth = () => {
    switch(device) {
      case "mobile": return "375px"
      case "tablet": return "768px"
      case "desktop": return "100%"
      default: return "100%"
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
        <div className="flex items-center gap-4">
            <div className="text-sm font-medium">Design Studio</div>
            <div className="h-4 w-px bg-border mx-2" />
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-8">
                <TabsList className="h-8">
                    <TabsTrigger value="preview" className="text-xs h-7 px-3"><Eye className="h-3.5 w-3.5 mr-1.5"/> Preview</TabsTrigger>
                    <TabsTrigger value="code" className="text-xs h-7 px-3"><Code className="h-3.5 w-3.5 mr-1.5"/> Code</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="h-4 w-px bg-border mx-2" />
            
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={historyIndex <= 0} title="Undo">
                    <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo">
                    <Redo className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground ml-2">
                    {historyIndex >= 0 && `v${historyIndex + 1}`}
                </span>
            </div>
        </div>

        {activeTab === "preview" && (
            <div className="flex items-center bg-background border rounded-md p-0.5">
                <Button variant={device === "desktop" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setDevice("desktop")} title="Desktop">
                    <Monitor className="h-4 w-4" />
                </Button>
                <Button variant={device === "tablet" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setDevice("tablet")} title="Tablet">
                    <Tablet className="h-4 w-4" />
                </Button>
                <Button variant={device === "mobile" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setDevice("mobile")} title="Mobile">
                    <Smartphone className="h-4 w-4" />
                </Button>
            </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRestoreDefault} disabled={isSaving} className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Restore Default
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
              if (confirm("Reset will revert to the default template. Are you sure?")) {
                setCode(defaultTemplate)
                pushToHistory(defaultTemplate)
              }
            }} className="h-8 text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-8 text-xs">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Publish
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-slate-100/50 relative">
        <div className={`flex-1 flex justify-center overflow-y-auto py-4 transition-all duration-300 ${activeTab === "code" ? "hidden" : "block"}`}>
             <div 
                className="bg-white shadow-xl transition-all duration-300 relative"
                style={{ 
                    width: getDeviceWidth(),
                    height: device === "desktop" ? "100%" : "850px", 
                    minHeight: "100%",
                    borderRadius: device === "desktop" ? "0" : "12px",
                    border: device === "desktop" ? "none" : "1px solid #e2e8f0",
                    overflow: "hidden"
                }}
             >
                <iframe 
                    ref={iframeRef}
                    className="w-full h-full border-none bg-white"
                    title="Preview"
                    // SECURITY: REMOVED 'allow-same-origin' to prevent XSS attacks
                    sandbox="allow-scripts allow-popups allow-forms"
                />
             </div>
        </div>

        <div className={`flex-1 flex flex-col bg-[#1e1e1e] ${activeTab === "preview" ? "hidden" : "block"}`}>
           {mounted ? (
             <Editor
                height="100%"
                defaultLanguage="html"
                value={code}
                onChange={(value) => setCode(value || "")}
                theme="vs-dark"
                options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 }
                }}
                loading={<div className="h-full w-full bg-[#1e1e1e] flex items-center justify-center text-muted-foreground">Loading Editor...</div>}
            />
           ) : (
             <div className="h-full w-full bg-[#1e1e1e] flex items-center justify-center text-muted-foreground">
               Initializing...
             </div>
           )}
        </div>
      </div>

      <div className="border-t p-4 bg-background z-20 shadow-sm">
        <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask AI to change the design (e.g. 'Change the header background color', 'Add a footer')..."
              className="pr-12 h-11 text-base shadow-sm"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">↵</span>
                </kbd>
              )}
            </div>
          </div>
          <Button size="icon" className="h-11 w-11" onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-center mt-2">
            <p className="text-[10px] text-muted-foreground">AI can make mistakes. Please review the changes.</p>
        </div>
      </div>
    </div>
  )
}
