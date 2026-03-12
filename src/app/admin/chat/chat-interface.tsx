'use client'

import { useState, useEffect, useRef } from 'react'
import { sendAdminMessage, getAdminMessages } from './actions'
import type { AdminMessage } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from 'next-auth/react'

export function ChatInterface() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  
  // Use a ref for the scrollable container directly
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
  const handleScroll = () => {
    const container = scrollContainerRef.current
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
    const container = scrollContainerRef.current
    if (shouldAutoScroll && container) {
      // Use instant scroll for better UX when auto-scrolling
      container.scrollTop = container.scrollHeight
    }
  }, [messages, shouldAutoScroll])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const tempContent = input
    setInput('') // Clear input immediately
    setIsLoading(true)
    
    // Force scroll to bottom when sending
    setShouldAutoScroll(true)
    // Immediate scroll
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }

    try {
      await sendAdminMessage(tempContent)
      await fetchMessages()
      // Focus input again just in case
      inputRef.current?.focus()
    } catch (error) {
      console.error("Failed to send message:", error)
      setInput(tempContent) // Restore on error
    } finally {
      setIsLoading(false)
      // Ensure focus is kept
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const getSenderLabel = (sender: AdminMessage['sender']) => {
    if (sender.role === 'SUPER_ADMIN') return '平台总编'
    if (sender.managedJournal) return `${sender.managedJournal.name} 主编`
    if (sender.managedConference) return `${sender.managedConference.name} 主席`
    if (sender.role === 'REVIEWER') return '责任编辑'
    return '管理员'
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <CardHeader className="pb-4 border-b">
        <CardTitle>管理员内部群聊</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        {/* Native scroll container for better control */}
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto p-4 space-y-4"
          onScroll={handleScroll}
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
