'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { reviewApplication, publishReview } from "./actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PrizeLevel {
  id: string
  name: string
  color: string
  order: number
}

interface ReviewDialogProps {
  applicationId: string
  nomineeName: string
  prizeLevels: PrizeLevel[]
  currentStatus: string
  currentComment?: string | null
  isPublished: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ReviewDialog({
  applicationId,
  nomineeName,
  prizeLevels,
  currentStatus,
  currentComment,
  isPublished,
  open,
  onOpenChange,
  onSuccess,
}: ReviewDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>("REJECTED")
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)

  // 初始化时设置当前值
  useEffect(() => {
    if (open) {
      setSelectedLevel(currentStatus || "REJECTED")
      setComment(currentComment || "")
    }
  }, [open, currentStatus, currentComment])

  const handleSubmit = async () => {
    setLoading(true)
    const res = await reviewApplication(applicationId, selectedLevel, comment)
    setLoading(false)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("评审结果已保存")
      onOpenChange(false)
      onSuccess()
    }
  }

  const handlePublish = async () => {
    if (!confirm("确定要发布评审结果吗？发布后结果将无法修改。")) {
      return
    }
    setPublishLoading(true)
    const res = await publishReview(applicationId)
    setPublishLoading(false)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("评审结果已发布")
      onOpenChange(false)
      onSuccess()
    }
  }

  // 按order排序奖项等级
  const sortedLevels = [...prizeLevels].sort((a, b) => a.order - b.order)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>评审申请 - {nomineeName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isPublished && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                该评审结果已发布，无法修改
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>评审结果</Label>
            <RadioGroup
              value={selectedLevel}
              onValueChange={setSelectedLevel}
              className="space-y-2"
              disabled={isPublished}
            >
              {sortedLevels.map((level) => (
                <div key={level.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={level.id} id={level.id} />
                  <Label 
                    htmlFor={level.id} 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: level.color }}
                    />
                    {level.name}
                  </Label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REJECTED" id="REJECTED" />
                <Label htmlFor="REJECTED" className="cursor-pointer text-red-600">
                  不予授奖
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">评审意见（可选）</Label>
            <Textarea
              id="comment"
              placeholder="请输入评审意见..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              disabled={isPublished}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          {!isPublished ? (
            <>
              <Button onClick={handleSubmit} disabled={loading} variant="outline">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存评审
              </Button>
              <Button onClick={handlePublish} disabled={publishLoading} className="bg-green-600 hover:bg-green-700">
                {publishLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                发布结果
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
