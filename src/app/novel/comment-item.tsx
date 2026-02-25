'use client'

import { useState } from "react"
import { useActionState } from "react"
import { toggleLike, deleteComment } from "./comment-actions"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, Trash2, Reply } from "lucide-react"
import { cn } from "@/lib/utils"
import { CommentForm } from "./comment-form"
import { toast } from "sonner"
import { usePathname } from "next/navigation"

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    image: string | null
  } | null
  guestName: string | null
  guestIp: string | null
  likes: { id: string, userId: string | null, guestIp: string | null }[]
  replies?: Comment[] // Make replies optional
}

interface CommentItemProps {
  comment: Comment
  user: any
  novelId: string
  path: string
  isReply?: boolean // Add flag to indicate if this is a reply (second level)
  currentIp?: string
}

export function CommentItem({ comment, user, novelId, path, isReply = false, currentIp }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  
  // Check like status: either user ID matches OR guest IP matches
  const isLiked = comment.likes?.some(like => {
    if (user) return like.userId === user.id
    if (currentIp) return like.guestIp === currentIp
    return false
  }) || false

  // Check owner status: either user ID matches OR guest IP matches
  const isOwner = user 
    ? (comment.user?.id === user.id) 
    : (currentIp && comment.guestIp === currentIp)

  // Only ADMIN (Editor-in-Chief) and SUPER_ADMIN can delete others' comments
  const isAdmin = user ? (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') : false
  const canDelete = isOwner || isAdmin

  const displayName = comment.user?.name || comment.guestName || "匿名用户"
  const avatarFallback = displayName[0]?.toUpperCase() || "?"

  const handleLike = async () => {
    await toggleLike(comment.id, path)
  }

  const handleDelete = async () => {
    if (!confirm("确定要删除这条评论吗？")) return
    await deleteComment(comment.id, path)
    toast.success("评论已删除")
  }

  // Determine parent ID for new replies:
  // If this is a top-level comment (isReply=false), the parent is this comment.
  // If this is already a reply (isReply=true), we don't support nesting deeper, 
  // so replies to replies should conceptually be replies to the original parent 
  // OR we just disable replying to replies if we strictly enforce 2 levels.
  // The user requirement says "Design only two levels... all under the first level original comment".
  // So if I am replying to a reply, the parentId should be THIS reply's parent (which we don't have easily here unless passed)
  // OR we just hide the reply button for 2nd level comments to simplify "2 levels" visually.
  // Let's hide Reply button for 2nd level comments to enforce flat structure visually.

  return (
    <div className={cn("flex gap-4 group", isReply ? "mt-4" : "")}>
      <Avatar className={cn("mt-1", isReply ? "w-6 h-6" : "w-8 h-8")}>
        <AvatarImage src={comment.user?.image || ""} />
        <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{displayName}</span>
          <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>
        
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>

        <div className="flex items-center gap-4 pt-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-6 px-2 text-xs", isLiked && "text-primary")}
            onClick={handleLike}
          >
            <ThumbsUp className={cn("w-3 h-3 mr-1", isLiked && "fill-current")} />
            {comment.likes?.length > 0 ? comment.likes.length : "赞"}
          </Button>
          
          {/* Only show Reply button for top-level comments */}
          {!isReply && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="w-3 h-3 mr-1" />
              回复
            </Button>
          )}

          {canDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              删除
            </Button>
          )}
        </div>

        {isReplying && !isReply && (
          <div className="pt-2 pl-4 border-l-2">
            <CommentForm 
              novelId={novelId} 
              user={user} 
              parentId={comment.id}
              onSuccess={() => setIsReplying(false)}
            />
          </div>
        )}

        {/* Only render replies if this is a top-level comment */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="pt-2 pl-4 border-l-2">
            {comment.replies.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                user={user} 
                novelId={novelId} 
                path={path}
                isReply={true}
                currentIp={currentIp}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
