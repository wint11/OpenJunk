'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { sendAdminMessage, getAdminMessages } from '@/app/admin/chat/actions'
import type { AdminMessage } from '@/app/admin/chat/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSession } from 'next-auth/react'
import { Terminal, Send, X, MonitorPlay, EyeOff, MessageCircle, Coffee } from 'lucide-react'
import { SessionProviderWrapper } from '@/components/session-provider-wrapper'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

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

function ChatContent({ onClose, pipWindow }: { onClose: () => void, pipWindow: Window }) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    try {
      const msgs = await getAdminMessages()
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

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom whenever messages change or window opens
  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages, pipWindow])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    try {
      await sendAdminMessage(input)
      setInput('')
      // Optimistically fetch messages immediately
      await fetchMessages()
      inputRef.current?.focus()
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Modern Casual Style
  return (
    <div className="flex flex-col h-full bg-background text-foreground font-sans text-sm overflow-hidden">
      <style>{`
        * { scrollbar-width: none !important; }
        *::-webkit-scrollbar { display: none !important; }
      `}</style>
      
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10"
      >
        {messages.map((msg) => {
          const isMe = session?.user?.name === msg.sender.name
          const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          
          return (
            <div key={msg.id} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
              <Avatar className="w-8 h-8 shrink-0 border">
                <AvatarFallback className="text-[10px] bg-muted">{msg.sender.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className={cn("flex flex-col max-w-[80%]", isMe ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 mb-1 px-1">
                   <span className="text-[10px] text-muted-foreground">{msg.sender.name}</span>
                   <span className="text-[10px] text-muted-foreground/60">{time}</span>
                </div>
                <div className={cn(
                  "px-3 py-2 rounded-2xl text-sm break-all shadow-sm",
                  isMe 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-white dark:bg-zinc-800 border rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-50">
            <Coffee className="w-8 h-8 mb-2" />
            <div className="text-xs">暂无消息，来喝杯咖啡吧...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 border-t bg-background flex gap-2 items-center">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-muted/30 focus-visible:bg-background rounded-full px-4 h-9"
          placeholder="说点什么..."
          autoFocus
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!input.trim() || isLoading}
          className="h-9 w-9 rounded-full shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}

export function GlobalChatWidget() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null)

  const togglePiP = async () => {
    if (pipWindow) {
      pipWindow.close()
      setPipWindow(null)
      return
    }

    try {
      if (!window.documentPictureInPicture) {
        alert("System Error: PiP API not supported.")
        return
      }

      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 320,
        height: 200,
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
      
      // Also copy all style tags from head (Tailwind often injects styles here in dev)
      const styleTags = document.head.querySelectorAll('style');
      styleTags.forEach(tag => {
        pipWin.document.head.appendChild(tag.cloneNode(true));
      });
      
      // Reset body styles to default (let theme handle it)
      // We check if dark mode is active in main window to set initial bg
      const isDark = document.documentElement.classList.contains('dark');
      pipWin.document.body.style.backgroundColor = isDark ? '#09090b' : '#ffffff';
      pipWin.document.body.style.margin = '0';
      
      // Copy the 'dark' class to the PiP window's html element if needed
      if (isDark) {
        pipWin.document.documentElement.classList.add('dark');
      }

      pipWin.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(pipWin);
    } catch (error) {
      console.error("Failed to open PiP:", error);
    }
  };

  return (
    <>
      {/* Casual Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={togglePiP}
          size="icon"
          className={`h-12 w-12 rounded-full shadow-xl transition-all duration-300 hover:scale-110 ${
            pipWindow ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
          }`}
          title={pipWindow ? "Close Chat" : "Open Chat"}
        >
          {pipWindow ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>

      {/* Render Chat in PiP if active */}
      {pipWindow && createPortal(
        <SessionProviderWrapper>
          <ChatContent onClose={() => pipWindow.close()} pipWindow={pipWindow} />
        </SessionProviderWrapper>,
        pipWindow.document.body
      )}
    </>
  )
}
