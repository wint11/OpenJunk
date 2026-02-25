"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";

export function MobileAppPrompter() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      // Simple regex for mobile detection
      if (/android|ipad|iphone|ipod|blackberry|windows phone|opera mini|iemobile|mobile/i.test(userAgent.toLowerCase())) {
        setIsMobile(true);
        // Prevent scrolling on body
        document.body.style.overflow = "hidden";
      }
    };

    checkMobile();

    // Cleanup if component unmounts (though unlikely for a global component)
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">OpenJunk App</h1>
          <p className="text-muted-foreground text-lg">
            为了提供更好的浏览体验，移动端请下载官方 App 访问。
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Button 
            size="lg" 
            className="w-full text-lg h-14 font-semibold shadow-lg"
            onClick={() => {
              window.location.href = "/apk/OpenJunkv1.0.0.apk";
            }}
          >
            <Download className="mr-2 h-6 w-6" />
            立即下载 APK
          </Button>
          <p className="text-sm text-muted-foreground/60">
            仅支持 Android 设备
          </p>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-secondary/20 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}
