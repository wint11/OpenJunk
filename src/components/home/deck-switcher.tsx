"use client"

import { useState, useEffect } from "react"
import { Novel } from "@prisma/client"
import { SplashTrashDeck } from "./splash-trash-deck"

interface DeckSwitcherProps {
  papers: (Novel & { journal: { id: string; name: string } | null })[]
}

type ViewMode = "pdf" | "cover"

export function DeckSwitcher({ papers }: DeckSwitcherProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("pdf")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedMode = localStorage.getItem("openjunk-view-mode") as ViewMode | null
    if (savedMode && (savedMode === "pdf" || savedMode === "cover")) {
      setViewMode(savedMode)
    }
  }, [])

  // 监听 localStorage 变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "openjunk-view-mode") {
        const newMode = e.newValue as ViewMode | null
        if (newMode && (newMode === "pdf" || newMode === "cover")) {
          setViewMode(newMode)
        }
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  if (!mounted) {
    return (
      <div className="flex flex-col flex-1 h-full bg-background overflow-hidden relative items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return <SplashTrashDeck papers={papers} viewMode={viewMode} />
}
