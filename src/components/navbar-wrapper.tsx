"use client"

import { usePathname } from "next/navigation"

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  if (pathname?.startsWith("/hidden_directory") || pathname?.startsWith("/novel/") || pathname === "/universe") {
    return null
  }
  
  return <>{children}</>
}
