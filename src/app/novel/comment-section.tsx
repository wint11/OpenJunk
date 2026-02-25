'use client'

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CommentForm } from "./comment-form"
import { CommentItem } from "./comment-item"
import { ArrowUpDown, MessageCircle } from "lucide-react"

interface CommentSectionProps {
  comments: any[]
  user: any
  novelId: string
  totalComments: number
  currentIp?: string
}

export function CommentSection({ comments: initialComments, user, novelId, totalComments, currentIp }: CommentSectionProps) {
  const [sort, setSort] = useState<'newest' | 'likes'>('newest')
  const path = usePathname()

  // Sort comments client-side for simplicity, or we can fetch sorted from server
  // Since we pass initialComments which might be sorted by server default, let's sort here
  const sortedComments = [...initialComments].sort((a, b) => {
    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else {
      return (b.likes?.length || 0) - (a.likes?.length || 0)
    }
  })

  return (
    <div className="space-y-8 py-8 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          评论 ({totalComments})
        </h3>
        
        <Select value={sort} onValueChange={(v: any) => setSort(v)}>
          <SelectTrigger className="w-[140px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">最新发布</SelectItem>
            <SelectItem value="likes">最多点赞</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CommentForm novelId={novelId} user={user} />

      <div className="space-y-6">
        {sortedComments.length > 0 ? (
          sortedComments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              user={user} 
              novelId={novelId}
              path={path}
              currentIp={currentIp}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
            暂无评论，快来抢沙发吧！
          </div>
        )}
      </div>
    </div>
  )
}
