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
import { Textarea } from "@/components/ui/textarea"
import { Edit, Loader2 } from "lucide-react"
import { updateNovelInfo } from "./actions"

interface EditInfoDialogProps {
  novelId: string
  defaultTitle: string
  defaultAuthor: string
  defaultDescription: string
  trigger?: React.ReactNode
}

export function EditInfoDialog({ 
  novelId, 
  defaultTitle, 
  defaultAuthor, 
  defaultDescription,
  trigger 
}: EditInfoDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    try {
        const formData = new FormData(e.currentTarget)
        await updateNovelInfo(formData)
        setOpen(false)
        alert("信息更新成功")
    } catch (error) {
        console.error(error)
        alert("操作失败，请重试")
    } finally {
        setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            修改信息
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>修改发布信息</DialogTitle>
          <DialogDescription>
            编辑论文的基本信息，确保发布内容准确无误。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="novelId" value={novelId} />
          
          <div className="grid gap-2">
            <Label htmlFor="title">标题</Label>
            <Input 
                id="title" 
                name="title" 
                defaultValue={defaultTitle}
                required 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="author">作者</Label>
            <Input 
                id="author" 
                name="author" 
                defaultValue={defaultAuthor}
                required 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">摘要</Label>
            <Textarea 
                id="description" 
                name="description" 
                defaultValue={defaultDescription}
                required 
                className="h-32"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
            </Button>
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存修改
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
