"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Github, Twitter, Mail } from "lucide-react"

export function Footer() {
  const pathname = usePathname()

  // Only show footer on Home ("/") and About ("/about") pages
  const shouldShow = pathname === "/" || pathname === "/about"

  if (!shouldShow) {
    return null
  }

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h4 className="text-lg font-bold tracking-tight">OpenJunk</h4>
            <p className="text-xs text-muted-foreground mt-1">
              汇集全球底刊与垃圾论文，打造最真实的学术垃圾场。
            </p>
          </div>
          
          <div className="flex gap-6 text-sm text-muted-foreground">
             <Link href="/about" className="hover:text-primary transition-colors">关于我们</Link>
             <Link href="/privacy" className="hover:text-primary transition-colors">隐私政策</Link>
             <Link href="/contact" className="hover:text-primary transition-colors">联系我们</Link>
          </div>

          <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} OpenJunk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
