'use client'

import { useState, useActionState, useEffect } from "react"
import { createFund } from "./actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"

export function CreateFundDialog({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createFund, null)

  useEffect(() => {
    if (state?.success && open) {
      setOpen(false)
    }
  }, [state, open])

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 新增项目
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新增基金项目</DialogTitle>
          <DialogDescription>
            创建一个新的基金项目（指南），供申请人申报。
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} className="grid gap-4 py-4">
          {state?.message && !state.success && (
            <div className="text-red-500 text-sm mb-2">{state.message}</div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">项目名称</Label>
            <Input id="title" name="title" className="col-span-3" placeholder="例如：2026年度面上项目" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">年度</Label>
            <Input 
                id="year" 
                name="year" 
                type="number" 
                className="col-span-3" 
                defaultValue={new Date().getFullYear()} 
                required 
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">基金大类</Label>
            <div className="col-span-3">
              <Select name="categoryId" required>
                <SelectTrigger>
                  <SelectValue placeholder="选择所属大类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="projectTypeChar" className="text-right">类别码</Label>
            <div className="col-span-3 flex items-center gap-2">
                <Input id="projectTypeChar" name="projectTypeChar" maxLength={1} className="w-20" placeholder="1" required />
                <span className="text-xs text-muted-foreground">1位 (立项编号第4位)</span>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customNumber" className="text-right">自定义码</Label>
            <div className="col-span-3 flex items-center gap-2">
                <Input id="customNumber" name="customNumber" maxLength={1} className="w-20" placeholder="5" required />
                <span className="text-xs text-muted-foreground">1位 (立项编号第5位)</span>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">开始时间</Label>
            <Input id="startDate" name="startDate" type="date" className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">结束时间</Label>
            <Input id="endDate" name="endDate" type="date" className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">项目指南</Label>
            <Input id="description" name="description" className="col-span-3" placeholder="简要描述申报要求..." />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "创建项目"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
