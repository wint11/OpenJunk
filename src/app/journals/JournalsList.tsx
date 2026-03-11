"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, FileText, Users, ArrowRight, ArrowUpDown } from "lucide-react"
import Image from "next/image"

type Journal = {
  id: string
  name: string
  description: string | null
  coverUrl: string | null
  createdAt: string
  _count: {
    admins: number
    reviewers: number
  }
  publishedPaperCount: number
}

type SortOption = 
  | "name-asc" 
  | "name-desc" 
  | "createdAt-desc" 
  | "createdAt-asc" 
  | "paperCount-desc" 
  | "paperCount-asc"

interface JournalsListProps {
  journals: Journal[]
}

export function JournalsList({ journals }: JournalsListProps) {
  const [sortBy, setSortBy] = useState<SortOption>("name-asc")

  const sortedJournals = useMemo(() => {
    const sorted = [...journals]
    switch (sortBy) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
        break
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name, "zh-CN"))
        break
      case "createdAt-desc":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "createdAt-asc":
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case "paperCount-desc":
        sorted.sort((a, b) => b.publishedPaperCount - a.publishedPaperCount)
        break
      case "paperCount-asc":
        sorted.sort((a, b) => a.publishedPaperCount - b.publishedPaperCount)
        break
    }
    return sorted
  }, [journals, sortBy])

  const sortOptions = [
    { value: "name-asc", label: "按名称 (A-Z)" },
    { value: "name-desc", label: "按名称 (Z-A)" },
    { value: "createdAt-desc", label: "最新注册" },
    { value: "createdAt-asc", label: "最早注册" },
    { value: "paperCount-desc", label: "发文最多" },
    { value: "paperCount-asc", label: "发文最少" },
  ]

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">旗下期刊</h1>
          <p className="text-muted-foreground">
            OpenJunk 拥有多个针对不同领域（或不分领域）的垃圾期刊矩阵。
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[160px] justify-between">
                {sortOptions.find((option) => option.value === sortBy)?.label}
                <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                {sortOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedJournals.map((journal) => (
          <Card key={journal.id} className="group hover:shadow-md transition-all duration-300 border-muted/60 bg-card">
            <div className="p-5 flex flex-col h-full">
              {/* Journal Title Row - Spans full width */}
              <div className="mb-4 flex items-center gap-2 overflow-hidden">
                  <BookOpen className="h-5 w-5 text-primary shrink-0" />
                  <h3 className="font-bold text-lg leading-tight text-foreground truncate" title={journal.name}>
                     {journal.name}
                  </h3>
               </div>

              <div className="flex gap-4 flex-1">
                {/* Left: Description & Stats */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                   <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed mb-3">
                     {journal.description || "暂无描述"}
                   </p>
                   
                   <div className="flex flex-wrap gap-2 mt-auto">
                      <Badge variant="secondary" className="h-6 text-xs font-normal px-2 bg-muted/50 text-muted-foreground hover:bg-muted">
                        <FileText className="mr-1 h-3 w-3" />
                        {journal.publishedPaperCount} 篇
                      </Badge>
                      <Badge variant="secondary" className="h-6 text-xs font-normal px-2 bg-muted/50 text-muted-foreground hover:bg-muted">
                        <Users className="mr-1 h-3 w-3" />
                        {journal._count.admins + journal._count.reviewers} 编辑
                      </Badge>
                   </div>
                </div>
                
                {/* Right: Cover Image - Aligned with Description */}
                <div className="shrink-0">
                  <div className="w-24 h-32 relative rounded-md overflow-hidden border shadow-sm bg-muted/30">
                    {journal.coverUrl ? (
                      <Image 
                        src={journal.coverUrl} 
                        alt={journal.name} 
                        fill 
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                         <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-5">
                <Button asChild className="w-full h-9 shadow-none bg-primary/90 hover:bg-primary" size="sm">
                  <Link href={`/journals/${journal.id}`} className="flex items-center justify-center">
                    查看期刊
                    <ArrowRight className="ml-2 h-3 w-3 opacity-50" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
