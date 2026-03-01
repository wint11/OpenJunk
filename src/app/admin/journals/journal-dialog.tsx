'use client'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { createJournal, updateJournal } from "./actions"
import { toast } from "sonner"

interface JournalDialogProps {
  mode: "create" | "edit"
  journal?: {
    id: string
    name: string
    description: string | null
    guidelines: string | null
    guidelinesUrl: string | null
    status: string
    coverUrl?: string | null
  }
}

export function JournalDialog({ mode, journal }: JournalDialogProps) {
  const [open, setOpen] = useState(false)
  const [deleteAttachment, setDeleteAttachment] = useState(false)

  async function handleSubmit(formData: FormData) {
    try {
      if (mode === "create") {
        await createJournal(formData)
        toast.success("期刊创建成功")
      } else {
        if (!journal?.id) return
        if (deleteAttachment) {
            formData.set("deleteGuidelinesFile", "true")
        }
        await updateJournal(journal.id, formData)
        toast.success("期刊更新成功")
      }
      setOpen(false)
      setDeleteAttachment(false) // Reset state
    } catch (error) {
      toast.error("操作失败")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button variant={mode === "create" ? "default" : "outline"} size={mode === "edit" ? "sm" : "default"}>
          {mode === "create" ? "创建期刊" : "编辑"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "创建新期刊" : "编辑期刊"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "填写以下信息创建一个新的期刊。" : "修改期刊信息。"}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
             {/* Left Column: Basic Info */}
             <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">名称</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={journal?.name}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={journal?.description || ""}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">状态</Label>
                  <Select name="status" defaultValue={journal?.status || "ACTIVE"}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">活跃</SelectItem>
                      <SelectItem value="ARCHIVED">归档</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cover">封面图</Label>
                  <Input
                     id="cover"
                     name="cover"
                     type="file"
                     accept="image/*"
                   />
                   {journal?.coverUrl && (
                     <p className="text-xs text-muted-foreground">
                         当前已有封面，上传新文件将覆盖
                     </p>
                   )}
                </div>
             </div>

             {/* Right Column: Guidelines */}
             <div className="space-y-6">
                <div className="grid gap-2 h-full flex flex-col">
                  <Label htmlFor="guidelines">投稿指南</Label>
                  <div className="flex-1 flex flex-col gap-4">
                     <Textarea
                        id="guidelines"
                        name="guidelines"
                        defaultValue={journal?.guidelines || ""}
                        className="flex-1 min-h-[300px]"
                        placeholder="请输入投稿指南 (支持 Markdown)"
                      />
                      
                      <div className="border p-4 rounded-md bg-muted/20 space-y-3">
                        <Label htmlFor="guidelinesFile" className="text-sm font-medium">
                          指南附件 (可选)
                        </Label>
                        <Input
                          id="guidelinesFile"
                          name="guidelinesFile"
                          type="file"
                          accept=".pdf,.doc,.docx,.zip,.rar"
                          className="cursor-pointer bg-background"
                        />
                        
                        {journal?.guidelinesUrl && !deleteAttachment && (
                          <div className="flex items-center justify-between bg-background border p-2 rounded text-sm">
                            <span className="text-muted-foreground truncate max-w-[200px]" title={journal.guidelinesUrl.split('/').pop()}>
                               已存在: {journal.guidelinesUrl.split('/').pop()}
                            </span>
                            <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => setDeleteAttachment(true)}
                            >
                                删除
                            </Button>
                          </div>
                        )}
                        
                        {deleteAttachment && (
                            <div className="text-xs text-destructive flex items-center gap-2 bg-destructive/10 p-2 rounded">
                                <span>将在保存后删除附件</span>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 px-2 text-xs hover:bg-destructive/20"
                                    onClick={() => setDeleteAttachment(false)}
                                >
                                    撤销
                                </Button>
                            </div>
                        )}
                      </div>
                  </div>
                </div>
             </div>
          </div>
          <DialogFooter>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
