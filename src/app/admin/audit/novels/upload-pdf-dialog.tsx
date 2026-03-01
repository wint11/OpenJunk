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
import { Upload, Loader2 } from "lucide-react"
import { uploadFinalPdf } from "./actions"

interface UploadPdfDialogProps {
  novelId: string
  trigger?: React.ReactNode
}

export function UploadPdfDialog({ novelId, trigger }: UploadPdfDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    try {
        const formData = new FormData(e.currentTarget)
        await uploadFinalPdf(formData)
        setOpen(false)
        alert("上传成功")
    } catch (error) {
        console.error(error)
        alert("操作失败，请重试")
    } finally {
        setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            上传PDF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>上传最终PDF文件</DialogTitle>
          <DialogDescription>
            请上传排版后的最终PDF文件。这将替换原始投稿文件。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="novelId" value={novelId} />
          
          <div className="grid gap-2">
            <Label htmlFor="pdfFile">选择PDF文件</Label>
            <Input 
                id="pdfFile" 
                name="pdfFile" 
                type="file" 
                accept=".pdf" 
                required 
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
            </Button>
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                确定上传
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
