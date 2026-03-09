"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface OnlineUsersCounterProps {
  className?: string
}

export function OnlineUsersCounter({ className }: OnlineUsersCounterProps) {
  const [count, setCount] = useState<number>(0)
  const [visitorId, setVisitorId] = useState<string>("")
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  // 初始化访客 ID
  useEffect(() => {
    // 防止重复初始化
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    // 从 localStorage 获取或生成新的访客 ID
    let storedVisitorId = localStorage.getItem("openjunk-visitor-id")
    if (!storedVisitorId) {
      storedVisitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("openjunk-visitor-id", storedVisitorId)
    }
    setVisitorId(storedVisitorId)
  }, [])

  // 获取在线人数
  const fetchOnlineCount = useCallback(async () => {
    try {
      const response = await fetch("/api/online-users")
      if (response.ok) {
        const data = await response.json()
        setCount(data.count)
      }
    } catch (error) {
      console.error("Failed to fetch online users:", error)
    }
  }, [])

  // 上报心跳
  const reportHeartbeat = useCallback(async () => {
    const currentVisitorId = localStorage.getItem("openjunk-visitor-id")
    if (!currentVisitorId) return

    try {
      await fetch("/api/online-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorId: currentVisitorId,
        }),
      })
    } catch (error) {
      console.error("Failed to report heartbeat:", error)
    }
  }, [])

  // 初始获取人数 + 定期更新
  useEffect(() => {
    if (!visitorId) return

    // 清理之前的定时器
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    if (countIntervalRef.current) {
      clearInterval(countIntervalRef.current)
    }

    // 初始获取和上报
    fetchOnlineCount()
    reportHeartbeat()

    // 每 30 秒上报一次心跳
    heartbeatIntervalRef.current = setInterval(() => {
      reportHeartbeat()
    }, 30000)

    // 每 10 秒更新一次人数显示
    countIntervalRef.current = setInterval(() => {
      fetchOnlineCount()
    }, 10000)

    // 页面可见性变化时立即更新
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchOnlineCount()
        reportHeartbeat()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // 页面关闭时发送离线信号（可选）
    const handleBeforeUnload = () => {
      // 使用 sendBeacon 确保请求发送
      const currentVisitorId = localStorage.getItem("openjunk-visitor-id")
      if (currentVisitorId) {
        navigator.sendBeacon("/api/online-users", JSON.stringify({
          visitorId: currentVisitorId,
          action: "leave"
        }))
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      if (countIntervalRef.current) {
        clearInterval(countIntervalRef.current)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [visitorId, fetchOnlineCount, reportHeartbeat])

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground",
        className
      )}
      title="当前在线用户"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <Users className="h-3 w-3" />
      <span>{count}</span>
    </div>
  )
}
