"use client"

import * as React from "react"
import Link from "next/link"
import { PaperCard } from "@/components/paper-card"
import { Button } from "@/components/ui/button"
import { BookOpen, Trash2 } from "lucide-react"
import { Novel } from "@prisma/client"

export default function BookshelfPage() {
  const [novels, setNovels] = React.useState<Novel[]>([])
  const [loading, setLoading] = React.useState(true)
  const [ids, setIds] = React.useState<string[]>([])

  React.useEffect(() => {
    const storedIds = JSON.parse(localStorage.getItem("bookshelf") || "[]") as string[]
    setIds(storedIds)

    if (storedIds.length > 0) {
      fetch('/api/novels/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: storedIds })
      })
      .then(res => res.json())
      .then(data => {
        // Parse dates because JSON returns strings
        const parsedData = data.map((n: any) => ({
          ...n,
          updatedAt: new Date(n.updatedAt),
          createdAt: new Date(n.createdAt || Date.now()) // Fallback if not returned
        }))
        setNovels(parsedData)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const removeFromShelf = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newIds = ids.filter(i => i !== id)
    setIds(newIds)
    setNovels(novels.filter(n => n.id !== id))
    localStorage.setItem("bookshelf", JSON.stringify(newIds))
  }

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">翻找垃圾中...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8 flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">垃圾桶</h1>
          <p className="text-muted-foreground">
            共捡回 {novels.length} 个垃圾
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/journals/browse">去捡垃圾</Link>
        </Button>
      </div>

      {novels.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center bg-muted/10">
          <Trash2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">垃圾桶空空如也</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            快去捡一些垃圾扔进来吧
          </p>
          <Button asChild>
            <Link href="/">去首页看看</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {novels.map((novel) => (
            <div key={novel.id} className="relative group">
              <PaperCard paper={novel} />
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-8 w-8 rounded-full shadow-lg"
                  onClick={(e) => removeFromShelf(novel.id, e)}
                  title="移出垃圾桶"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
