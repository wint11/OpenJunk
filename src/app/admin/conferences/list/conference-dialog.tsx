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
import { createConference, updateConference } from "./actions"
import { toast } from "sonner"
import { CalendarIcon, Loader2 } from "lucide-react"

interface ConferenceDialogProps {
  mode: "create" | "edit"
  conference?: {
    id: string
    name: string
    description: string | null
    location: string | null
    startDate: Date
    endDate: Date
    status: string
    coverUrl?: string | null
  }
}

export function ConferenceDialog({ mode, conference }: ConferenceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      if (mode === "create") {
        await createConference(formData)
        toast.success("会议创建成功")
      } else {
        if (!conference?.id) return
        await updateConference(conference.id, formData)
        toast.success("会议更新成功")
      }
      setOpen(false)
    } catch (error) {
      toast.error("操作失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Format date for input type="date"
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button variant={mode === "create" ? "default" : "outline"} size={mode === "edit" ? "sm" : "default"}>
          {mode === "create" ? "创建会议" : "编辑"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] flex flex-col h-[80vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{mode === "create" ? "创建新会议" : "编辑会议"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "填写以下信息创建一个新的学术会议。" : "修改会议详细信息。"}
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-6">
             <div className="grid gap-3">
               <Label htmlFor="name">会议名称</Label>
               <Input
                 id="name"
                 name="name"
                 defaultValue={conference?.name}
                 required
                 className="h-10"
               />
             </div>

             <div className="grid gap-3">
               <Label htmlFor="description">描述</Label>
               <Textarea
                 id="description"
                 name="description"
                 defaultValue={conference?.description || ""}
                 className="min-h-[120px] resize-none"
               />
             </div>

             <div className="grid gap-3">
               <Label htmlFor="location">举办地点</Label>
               <Input
                 id="location"
                 name="location"
                 defaultValue={conference?.location || ""}
                 className="h-10"
               />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-3">
                 <Label htmlFor="startDate">开始日期</Label>
                 <div className="relative">
                   <Input
                     id="startDate"
                     name="startDate"
                     type="date"
                     defaultValue={conference ? formatDate(conference.startDate) : ""}
                     required
                     className="h-10 pl-10"
                   />
                   <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                 </div>
               </div>
               <div className="grid gap-3">
                 <Label htmlFor="endDate">结束日期</Label>
                 <div className="relative">
                   <Input
                     id="endDate"
                     name="endDate"
                     type="date"
                     defaultValue={conference ? formatDate(conference.endDate) : ""}
                     required
                     className="h-10 pl-10"
                   />
                   <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                 </div>
               </div>
             </div>

             <div className="grid gap-3">
               <Label htmlFor="status">状态</Label>
               <Select name="status" defaultValue={conference?.status || "ACTIVE"}>
                 <SelectTrigger className="h-10">
                   <SelectValue placeholder="选择状态" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="ACTIVE">正在筹备/进行中</SelectItem>
                   <SelectItem value="COMPLETED">已结束</SelectItem>
                   <SelectItem value="CANCELLED">已取消</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <div className="grid gap-3">
               <Label htmlFor="cover">封面图</Label>
               <Input
                  id="cover"
                  name="cover"
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                />
                {conference?.coverUrl && (
                  <p className="text-xs text-muted-foreground">
                      当前已有封面，上传新文件将覆盖
                  </p>
                )}
             </div>
          </div>
          
          <DialogFooter className="pt-4 border-t mt-auto flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>取消</Button>
            <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
