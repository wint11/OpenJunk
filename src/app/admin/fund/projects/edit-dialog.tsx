'use client'

import { useState, useActionState, useEffect } from "react"
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
import { updateFund } from "./actions"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"

export function EditFundDialog({ fund }: { fund: any }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
    // Client-side validation if needed
    return await updateFund(prev, formData)
  }, { success: false, message: '' })

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      setOpen(false)
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state, setOpen])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑基金项目</DialogTitle>
          <DialogDescription>
            修改基金项目的基本信息和指南内容。
          </DialogDescription>
        </DialogHeader>

        <form id="edit-fund-form" action={formAction} className="space-y-4 py-4">
          <input type="hidden" name="id" value={fund.id} />
          <input type="hidden" name="categoryId" value={fund.categoryId} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">项目名称</Label>
              <Input id="title" name="title" defaultValue={fund.title} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">年度</Label>
              <Input id="year" name="year" type="number" defaultValue={fund.year} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">开始时间</Label>
              <Input 
                id="startDate" 
                name="startDate" 
                type="date" 
                defaultValue={fund.startDate ? format(new Date(fund.startDate), 'yyyy-MM-dd') : ''} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">结束时间</Label>
              <Input 
                id="endDate" 
                name="endDate" 
                type="date" 
                defaultValue={fund.endDate ? format(new Date(fund.endDate), 'yyyy-MM-dd') : ''} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectTypeChar">类别码 (第4位)</Label>
              <Input id="projectTypeChar" name="projectTypeChar" maxLength={1} defaultValue={fund.projectTypeChar || ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customNumber">自定义码 (第5位)</Label>
              <Input id="customNumber" name="customNumber" maxLength={1} defaultValue={fund.customNumber || ''} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label htmlFor="status">状态</Label>
               <Select name="status" defaultValue={fund.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">草稿</SelectItem>
                    <SelectItem value="ACTIVE">进行中</SelectItem>
                    <SelectItem value="CLOSED">已截止</SelectItem>
                    <SelectItem value="ARCHIVED">归档</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guideContent">指南内容</Label>
            <Textarea 
              id="guideContent" 
              name="description" 
              defaultValue={fund.guideContent || ''} 
              className="min-h-[150px]"
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button type="submit" form="edit-fund-form" disabled={isPending}>
            {isPending ? "保存中..." : "保存修改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
