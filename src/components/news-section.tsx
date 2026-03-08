"use client"

import { Megaphone } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getActiveNews, type NewsItem } from "@/lib/news-config"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface NewsSectionProps {
  className?: string
  autoScrollInterval?: number
}

export function NewsSection({ className, autoScrollInterval = 5000 }: NewsSectionProps) {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0)
  const activeNews = getActiveNews()
  const router = useRouter()

  useEffect(() => {
    if (activeNews.length <= 1) return

    const interval = setInterval(() => {
      setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % activeNews.length)
    }, autoScrollInterval)

    return () => clearInterval(interval)
  }, [activeNews.length, autoScrollInterval])

  const handleClick = () => {
    const currentNews = activeNews[currentNewsIndex]
    if (currentNews?.link) {
      router.push(currentNews.link)
    }
  }

  if (activeNews.length === 0) {
    return null
  }

  const currentNews = activeNews[currentNewsIndex]
  const hasLink = !!currentNews?.link

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-md text-sm font-medium text-foreground hover:bg-background/90 transition-colors cursor-pointer max-w-[90vw] md:max-w-2xl mx-auto z-50 relative overflow-hidden",
        hasLink && "hover:shadow-lg hover:scale-105 active:scale-95",
        className
      )}
    >
      <Megaphone className="w-4 h-4 text-primary flex-shrink-0" />
      
      <div className="flex-1 min-w-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentNewsIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "block w-full whitespace-nowrap",
              hasLink && "text-primary hover:text-primary/80"
            )}
          >
            {currentNews?.content}
          </motion.span>
        </AnimatePresence>
      </div>

      {hasLink && (
        <div className="flex-shrink-0 text-primary">
          ↗
        </div>
      )}

    </motion.div>
  )
}
