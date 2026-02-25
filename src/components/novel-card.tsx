"use client"

import Link from "next/link"
import Image from "next/image"
import { Novel } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Star, BookOpen, Flame } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface NovelCardProps {
  novel: Novel
}

export function NovelCard({ novel }: NovelCardProps) {
  return (
    <Link 
      href={`/novel/${novel.id}`} 
      className="group block h-full relative"
    >
      <Card className="h-full overflow-hidden border-0 bg-transparent shadow-none">
        <div className={cn(
          "relative aspect-[2/3] w-full overflow-hidden rounded-xl shadow-sm transition-all duration-300 group-hover:shadow-xl ring-1 ring-black/5 dark:ring-white/10",
          "group-hover:shadow-primary/20"
        )}>
          <Image
            src={novel.coverUrl || "/placeholder.png"}
            alt={novel.title}
            fill
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-110"
            )}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          {/* Hover Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
             <div className="flex items-center justify-between text-xs text-white/90 font-medium mb-2">
               <span className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                 <Flame className="h-3.5 w-3.5 text-orange-500" />
                 {Math.round(novel.popularity || 0)}
               </span>
               <span className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                 <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                 {novel.rating}
               </span>
             </div>
             <div className="flex items-center justify-center w-full">
                <span className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300",
                  "bg-primary text-primary-foreground"
                )}>
                  <BookOpen className="h-4 w-4" />
                  阅读论文
                </span>
             </div>
          </div>
        </div>
        
        <CardContent className="p-3 pt-4 space-y-1">
          <h3 className={cn(
            "line-clamp-1 font-bold tracking-tight text-lg transition-colors",
            "group-hover:text-primary"
          )}>
            {novel.title}
          </h3>
          <div className="flex items-center justify-between gap-2">
             <p className="line-clamp-1 text-sm text-muted-foreground">
              {novel.author}
            </p>
            <Badge variant="outline" className={cn(
              "h-5 px-1.5 text-[10px] font-normal border-muted-foreground/30 text-muted-foreground",
            )}>
              {novel.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
