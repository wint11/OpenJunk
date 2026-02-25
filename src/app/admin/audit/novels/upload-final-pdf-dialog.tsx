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
import { Check, Loader2 } from "lucide-react"
import { approveNovel } from "./actions"

interface UploadFinalPdfDialogProps {
  novelId: string
  trigger?: React.ReactNode
}

export function UploadFinalPdfDialog({ novelId, trigger }: UploadFinalPdfDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    try {
        const formData = new FormData(e.currentTarget)
        await approveNovel(formData)
        setOpen(false)
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
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700"
            title="录用"
          >
            <Check className="h-4 w-4" />
            <span className="sr-only">录用</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>录用并发布</DialogTitle>
          <DialogDescription>
            请上传最终定稿的PDF文件以供发布。此文件将替换原投稿文件并对公众可见。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="novelId" value={novelId} />
          
          <div className="grid gap-2">
            <Label htmlFor="pdfFile">最终PDF文件 (必填)</Label>
            <Input 
                id="pdfFile" 
                name="pdfFile" 
                type="file" 
                accept=".pdf" 
                required 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feedback">审稿意见 (选填)</Label>
            <Textarea 
                id="feedback" 
                name="feedback" 
                placeholder="请输入录用意见..." 
                defaultValue="稿件质量符合要求，予以录用发布。"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                确认录用
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
