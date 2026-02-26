"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // /hidden_directory should not have top padding as it has its own full screen layout
  // /novel/ pages also have no navbar, so no top padding needed
  // /universe needs full screen
  const isFullScreen = pathname?.startsWith("/hidden_directory") || pathname?.startsWith("/novel/") || pathname === "/universe"
  
  return (
    <main className={cn("flex-1 flex flex-col min-h-0", !isFullScreen && "pt-16")}>
      {children}
    </main>
  )
}
