'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Image as ImageIcon, Loader2, AlertTriangle } from "lucide-react"
import { deleteNovel, requestCoverUpdate, withdrawNovel } from "./actions"
import type { Novel } from "@prisma/client"

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "操作失败"
}

export function WorkActions({
  novel,
}: {
  novel: Pick<Novel, "id" | "pendingCoverUrl" | "serializationStatus" | "status">
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isUpdatingCover, setIsUpdatingCover] = useState(false)
  const [newCoverUrl, setNewCoverUrl] = useState("")
  const [isCoverDialogOpen, setIsCoverDialogOpen] = useState(false)

  const handleDelete = async () => {
    if (!confirm("确定要删除该稿件吗？删除后无法恢复！")) return
    setIsDeleting(true)
    try {
      await deleteNovel(novel.id)
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleWithdraw = async () => {
    if (!confirm("确定要撤回该稿件吗？撤回后稿件将变为“已拒绝/未通过”状态，不再对公众可见。")) return
    setIsWithdrawing(true)
    try {
      await withdrawNovel(novel.id)
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Dialog open={isCoverDialogOpen} onOpenChange={setIsCoverDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>申请更新封面</DialogTitle>
            <DialogDescription>
              请输入新的封面图片链接。提交后需等待管理员审核。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coverUrl" className="text-right">
                图片链接
              </Label>
              <Input
                id="coverUrl"
                value={newCoverUrl}
                onChange={(e) => setNewCoverUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
                onClick={async () => {
                    if (!newCoverUrl) return
                    setIsUpdatingCover(true)
                    try {
                        await requestCoverUpdate(novel.id, newCoverUrl)
                        setIsCoverDialogOpen(false)
                        setNewCoverUrl("")
                        alert("申请已提交，请等待审核")
                    } catch (error) {
                        alert(getErrorMessage(error))
                    } finally {
                        setIsUpdatingCover(false)
                    }
                }} 
                disabled={isUpdatingCover}
            >
              {isUpdatingCover && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="outline" size="sm" onClick={() => setIsCoverDialogOpen(true)}>
        <ImageIcon className="mr-2 h-4 w-4" />
        更新封面
      </Button>

      {novel.status === 'PUBLISHED' && (
        <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleWithdraw} 
            disabled={isWithdrawing}
        >
            {isWithdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
            撤稿
        </Button>
      )}
      
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleDelete} 
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
        删除
      </Button>
    </div>
  )
}
