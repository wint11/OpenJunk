
"use client"

import { useEffect, useState } from "react"
import { X, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AppDownloadBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    // Check if user is on mobile
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isAndroidDevice = /android/i.test(userAgent)

    // Check if banner was previously closed
    const wasClosed = localStorage.getItem("app-banner-closed")

    if (isMobile && !wasClosed) {
      setIsVisible(true)
      setIsAndroid(isAndroidDevice)
    }
  }, [])

  if (!isVisible) return null

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem("app-banner-closed", "true")
  }

  const handleDownload = () => {
    if (isAndroid) {
      window.location.href = "/app/smartreview.apk"
    } else {
      // iOS fallback or logic
      alert("iOS版本敬请期待")
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 shadow-lg animate-in slide-in-from-bottom">
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">下载 SmartReview APP</h3>
            <p className="text-xs text-muted-foreground">随时随地阅读期刊论文</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleDownload}>
            立即下载
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
