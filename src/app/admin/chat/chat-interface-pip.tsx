'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { sendAdminMessage, getAdminMessages } from './actions'
import type { AdminMessage } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from 'next-auth/react'
import { PictureInPicture2, X } from 'lucide-react'

// Add type definition for Document Picture-in-Picture API
declare global {
  interface Window {
    documentPictureInPicture: {
      requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
      window: Window | null;
      addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
      removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    };
  }
}

export function ChatInterfacePip() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const [pipBgColor, setPipBgColor] = useState('bg-zinc-50 dark:bg-zinc-950')
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  
  // Use a ref for the scrollable container directly
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pipScrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pipInputRef = useRef<HTMLInputElement>(null)

  const fetchMessages = async () => {
    try {
      const msgs = await getAdminMessages()
      // Only update if we have new messages or initial load
      setMessages(prev => {
        if (prev.length === 0 && msgs.length > 0) return msgs
        if (msgs.length > 0 && msgs[msgs.length - 1].id !== prev[prev.length - 1]?.id) return msgs
        if (msgs.length !== prev.length) return msgs
        return prev
      })
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  // Handle scroll events to detect if user is at bottom
  const handleScroll = (isPip = false) => {
    const container = isPip ? pipScrollContainerRef.current : scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    // If user is close to bottom (within 50px), enable auto-scroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    
    // Only update state if it changed to avoid re-renders
    if (isAtBottom !== shouldAutoScroll) {
      setShouldAutoScroll(isAtBottom)
    }
  }

  // Initial load and polling
  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll effect
  useEffect(() => {
    const container = pipWindow ? pipScrollContainerRef.current : scrollContainerRef.current
    if (shouldAutoScroll && container) {
      // Use instant scroll for better UX when auto-scrolling
      container.scrollTop = container.scrollHeight
    }
  }, [messages, shouldAutoScroll, pipWindow])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const tempContent = input
    setInput('') // Clear input immediately
    setIsLoading(true)
    
    // Force scroll to bottom when sending
    setShouldAutoScroll(true)
    
    // Immediate scroll
    const container = pipWindow ? pipScrollContainerRef.current : scrollContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }

    try {
      await sendAdminMessage(tempContent)
      await fetchMessages()
      // Focus input again just in case
      const currentInput = pipWindow ? pipInputRef.current : inputRef.current
      currentInput?.focus()
    } catch (error) {
      console.error("Failed to send message:", error)
      setInput(tempContent) // Restore on error
    } finally {
      setIsLoading(false)
      // Ensure focus is kept
      setTimeout(() => {
        const currentInput = pipWindow ? pipInputRef.current : inputRef.current
        currentInput?.focus()
      }, 0)
    }
  }

  const togglePiP = async () => {
    if (pipWindow) {
      pipWindow.close()
      setPipWindow(null)
      return
    }

    try {
      // Check API support
      if (!window.documentPictureInPicture) {
        alert("您的浏览器不支持 Document Picture-in-Picture API，请使用最新版 Chrome 或 Edge。")
        return
      }

      // Request a PiP window
      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 300,
        height: 300, // Reduced height as requested
      });

      // Copy all style sheets from the main window to the PiP window
      Array.from(document.styleSheets).forEach((styleSheet) => {
        try {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            pipWin.document.head.appendChild(link);
          } else if (styleSheet.cssRules) {
            const newStyleSheet = document.createElement('style');
            Array.from(styleSheet.cssRules).forEach((cssRule) => {
              newStyleSheet.appendChild(document.createTextNode(cssRule.cssText));
            });
            pipWin.document.head.appendChild(newStyleSheet);
          }
        } catch (e) {
          console.warn('Could not copy stylesheet:', e);
        }
      });
      
      // Also copy all style tags from head (Tailwind often injects styles here)
      const styleTags = document.head.querySelectorAll('style');
      styleTags.forEach(tag => {
        pipWin.document.head.appendChild(tag.cloneNode(true));
      });

      // Handle PiP window close
      pipWin.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(pipWin);
    } catch (error) {
      console.error("Failed to open PiP window:", error);
    }
  };

  const getSenderLabel = (sender: AdminMessage['sender']) => {
    if (sender.role === 'SUPER_ADMIN') return '平台总编'
    if (sender.managedJournal) return `${sender.managedJournal.name} 主编`
    if (sender.managedConference) return `${sender.managedConference.name} 主席`
    if (sender.role === 'REVIEWER') return '责任编辑'
    return '管理员'
  }

  // Render content for PiP window (Minimalist View)
  const renderPiPContent = () => {
    if (!pipWindow) return null;

    // Show more messages since we have more height now
    const lastMessages = messages.slice(-10);

    return createPortal(
      <div className={`flex flex-col h-full p-2 ${pipBgColor} relative group/pip transition-colors duration-300`}>
        {/* Style injection to hide scrollbars completely */}
        <style>{`
          /* Force hide scrollbars on all elements inside the portal */
          * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
        `}</style>
        
        <div 
          ref={pipScrollContainerRef}
          className="flex-1 overflow-y-auto mb-2 space-y-2 pr-1 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={() => handleScroll(true)}
        >
          {lastMessages.map((msg) => {
             const isMe = session?.user?.name === msg.sender.name
             return (
               <div key={msg.id} className={`flex items-start gap-2 text-xs group ${isMe ? 'flex-row-reverse' : ''}`}>
                 <div className={`flex flex-col max-w-[90%] ${isMe ? 'items-end' : 'items-start'}`}>
                   {/* Name only visible on hover to save space */}
                   <div className="flex items-center gap-1.5 mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="font-semibold truncate max-w-[60px] text-[10px] text-zinc-600 dark:text-zinc-400">{msg.sender.name}</span>
                     <span className="text-[9px] bg-black/5 dark:bg-white/10 px-1 rounded text-zinc-500">
                       {msg.sender.role === 'SUPER_ADMIN' ? '总编' : 
                        msg.sender.role === 'REVIEWER' ? '责编' : 
                        msg.sender.managedJournal ? '主编' : '管理'}
                     </span>
                   </div>
                   <div className={`px-2.5 py-1.5 rounded-2xl break-all shadow-sm border ${
                     isMe 
                       ? 'bg-blue-600 text-white border-blue-600 rounded-tr-none' 
                       : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 rounded-tl-none'
                   }`}>
                     {msg.content}
                   </div>
                 </div>
               </div>
             )
          })}
          {lastMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-1">
              <div className="text-xs">暂无消息</div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSend} className="flex gap-2 items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-1 py-1 shadow-sm">
          {/* Color Palette Trigger */}
          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setIsPaletteOpen(!isPaletteOpen)}
              className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-400 via-purple-400 to-rose-400 border border-black/10 shadow-sm opacity-70 hover:opacity-100 transition-opacity"
              title="切换背景颜色"
            />
            {isPaletteOpen && (
              <div className="absolute bottom-full left-0 mb-2 flex flex-col gap-1.5 p-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-full shadow-lg border border-black/5 dark:border-white/10 z-50">
                {[
                  { name: 'Light', class: 'bg-zinc-50', color: 'bg-zinc-50' },
                  { name: 'Dark', class: 'bg-zinc-900', color: 'bg-zinc-900' },
                  { name: 'Blue', class: 'bg-blue-50', color: 'bg-blue-50' },
                  { name: 'Rose', class: 'bg-rose-50', color: 'bg-rose-50' },
                ].map((bg) => (
                  <button
                    key={bg.name}
                    type="button"
                    onClick={() => {
                      setPipBgColor(bg.class)
                      setIsPaletteOpen(false)
                    }}
                    className={`w-4 h-4 rounded-full border border-black/10 shadow-sm ${bg.color} ${pipBgColor === bg.class ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:scale-110'} transition-all`}
                    title={bg.name}
                  />
                ))}
              </div>
            )}
          </div>

          <Input
            ref={pipInputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="发送..."
            className="h-6 text-xs flex-1 border-0 focus-visible:ring-0 bg-transparent px-2 shadow-none placeholder:text-muted-foreground/70"
            autoFocus
            autoComplete="off"
          />
          <Button 
            type="submit" 
            size="sm" 
            className="h-6 w-6 rounded-full p-0 shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-sm mr-0.5" 
            disabled={isLoading || !input.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 ml-0.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </Button>
        </form>
      </div>,
      pipWindow.document.body
    );
  };

  // If PiP is active, show a placeholder in the main window
  if (pipWindow) {
    return (
      <Card className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] justify-center items-center bg-muted/30">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">聊天窗口已在画中画模式中打开</div>
          <Button onClick={() => pipWindow.close()} variant="outline">
            <X className="mr-2 h-4 w-4" />
            退出画中画
          </Button>
        </div>
        {renderPiPContent()}
      </Card>
    )
  }

  // Regular View
  return (
    <Card className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
        <CardTitle>管理员内部群聊</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={togglePiP}
          title="开启画中画模式"
        >
          <PictureInPicture2 className="h-5 w-5" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        {/* Native scroll container for better control */}
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto p-4 space-y-4"
          onScroll={() => handleScroll(false)}
        >
          {messages.map((msg) => {
            const isMe = session?.user?.name === msg.sender.name
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="w-8 h-8 shrink-0 mb-1">
                    <AvatarFallback>{msg.sender.name?.[0]?.toUpperCase() || 'A'}</AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-medium text-foreground/70">
                        {msg.sender.name || 'Unknown'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border">
                        {getSenderLabel(msg.sender)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div
                      className={`px-3 py-2 rounded-lg text-sm break-all shadow-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-muted text-foreground rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 border-t bg-background">
        <form onSubmit={handleSend} className="flex w-full gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            // Remove disabled state to keep focus
            className="flex-1"
            autoFocus
            autoComplete="off"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? '发送中' : '发送'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
