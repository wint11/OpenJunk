"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, X } from "lucide-react";

export function MobileAppPrompter() {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 检查是否已经关闭过
    const dismissed = localStorage.getItem("mobile-app-prompter-dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      // Simple regex for mobile detection
      if (/android|ipad|iphone|ipod|blackberry|windows phone|opera mini|iemobile|mobile/i.test(userAgent.toLowerCase())) {
        setIsMobile(true);
      }
    };

    checkMobile();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // 存储到 localStorage，24小时内不再显示
    localStorage.setItem("mobile-app-prompter-dismissed", Date.now().toString());
  };

  // 检查是否需要重新显示（超过24小时）
  useEffect(() => {
    const dismissed = localStorage.getItem("mobile-app-prompter-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - dismissedTime > oneDay) {
        localStorage.removeItem("mobile-app-prompter-dismissed");
        setIsDismissed(false);
      }
    }
  }, []);

  if (!isMobile || isDismissed || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* 左侧：图标和文字 */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">OpenJunk App</h3>
              <p className="text-xs text-muted-foreground truncate">
                下载 App 获得更好体验
              </p>
            </div>
          </div>

          {/* 右侧：按钮和关闭 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="h-9 px-4 text-sm font-medium"
              onClick={() => {
                window.location.href = "/apk/OpenJunkv1.0.0.apk";
              }}
            >
              <Download className="mr-1.5 h-4 w-4" />
              下载
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
