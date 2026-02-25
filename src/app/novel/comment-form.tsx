'use client'

import { useState } from "react"
import { useActionState } from "react"
import { createComment, CommentState } from "./comment-actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { toast } from "sonner"

interface CommentFormProps {
  novelId: string
  user: any
  parentId?: string
  onSuccess?: () => void
}

const initialState: CommentState = {
  error: null,
  success: false
}

export function CommentForm({ novelId, user, parentId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState("")
  
  const formAction = async (prevState: CommentState, formData: FormData) => {
    // Add parentId manually if needed
    if (parentId) formData.append('parentId', parentId)
    const result = await createComment(prevState, formData)
    
    if (result.success) {
      setContent("")
      toast.success("评论发表成功")
      if (onSuccess) onSuccess()
    } else if (result.error) {
      toast.error(result.error)
    }
    
    return result
  }
  
  const [state, action, isPending] = useActionState(formAction, initialState)

  return (
    <form action={action} className="flex gap-4 items-start">
      <Avatar className="w-8 h-8 mt-1">
        <AvatarImage src={user?.image || ""} />
        <AvatarFallback>{user?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <input type="hidden" name="novelId" value={novelId} />
        <Textarea 
          name="content" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={user ? (parentId ? "写下你的回复..." : "写下你的评论...") : "未登录将以匿名用户身份发表评论..."}
          className="min-h-[80px] resize-none"
          required
        />
        <div className="flex justify-end items-center gap-2">
          {!user && <span className="text-xs text-muted-foreground">以匿名身份发布</span>}
          <Button type="submit" size="sm" disabled={isPending || !content.trim()}>
            {isPending ? "发送中..." : (
              <>
                <Send className="w-3 h-3 mr-2" />
                发送
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
