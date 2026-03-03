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
import { Upload, Loader2, FileText } from "lucide-react"
import { toast } from "sonner"
import { uploadRevisedNovel } from "./actions"

interface UploadRevisionDialogProps {
  novelId: string
  trigger?: React.ReactNode
  accept?: string
}

export function UploadRevisionDialog({ novelId, trigger, accept = ".pdf" }: UploadRevisionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [changeLog, setChangeLog] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      // Basic extension check
      if (accept && !selectedFile.name.toLowerCase().endsWith(accept.toLowerCase())) {
         toast.error(`请上传 ${accept} 格式的文件`)
         // Clear the input
         e.target.value = ''
         return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("请选择文件")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("novelId", novelId)
      formData.append("pdfFile", file)
      formData.append("changeLog", changeLog)

      const result = await uploadRevisedNovel(formData)

      if (result.success) {
        toast.success("修改稿上传成功")
        setOpen(false)
        setFile(null)
        setChangeLog("")
      } else {
        toast.error(result.message || "上传失败")
      }
    } catch (error) {
      toast.error("上传出错，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default">
            <Upload className="mr-2 h-4 w-4" />
            上传修改稿件
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>上传修改稿件</DialogTitle>
          <DialogDescription>
            请上传根据评审意见修改后的 PDF 文件，并简要说明修改内容。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">论文文件 ({accept})</Label>
            <div className="flex items-center gap-2">
                <Input 
                    id="file" 
                    type="file" 
                    accept={accept}
                    onChange={handleFileChange}
                    className="cursor-pointer"
                />
            </div>
            {file && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    已选择: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="changelog">修改说明 (Change Log)</Label>
            <Textarea 
                id="changelog"
                placeholder="例如：1. 修正了参考文献格式；2. 补充了实验数据..."
                value={changeLog}
                onChange={(e) => setChangeLog(e.target.value)}
                className="min-h-[100px]"
                required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button type="submit" disabled={loading || !file}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认上传
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
