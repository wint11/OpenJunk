'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ChatDownloadFAB() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // 检查是否在admin路径下
  useEffect(() => {
    const checkPath = () => {
      const isAdminPath = window.location.pathname.startsWith('/admin')
      setIsVisible(isAdminPath)
    }
    checkPath()
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* 展开的内容 */}
      {isExpanded && (
        <div className="bg-background border rounded-lg shadow-lg p-4 mb-2 w-64 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm">桌面版群聊客户端</span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            隐蔽设计，支持老板键 (Alt+Q) 快速隐藏，适合摸鱼使用
          </p>
          <a
            href="/downloads/OpenJunk-Chat.exe"
            download
            className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            下载安装包
          </a>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Windows 64位 · 约 80MB
          </p>
        </div>
      )}

      {/* 浮动按钮 */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        size="icon"
      >
        {isExpanded ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageSquare className="h-5 w-5" />
        )}
      </Button>
    </div>
  )
}
