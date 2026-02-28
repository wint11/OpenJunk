'use client'

import { useState, useActionState, useEffect } from "react"
import { createFundDepartment } from "./actions"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"

// Define the state type based on the action return type
type ActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
} | null

interface Category {
    id: string
    name: string
}

export function CreateDepartmentDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createFundDepartment, null)

  useEffect(() => {
    if (state?.success && open) {
      setOpen(false)
    }
  }, [state, open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 新建部门
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新建基金部门</DialogTitle>
          <DialogDescription>
            在基金大类下创建新的部门（如：数理科学部）。
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} className="grid gap-4 py-4">
          {state?.message && !state.success && (
            <div className="text-red-500 text-sm mb-2">{state.message}</div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="categoryId" className="text-right">所属基金</Label>
            <Select name="categoryId" required>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择基金大类" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                            {category.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">部门名称</Label>
            <Input id="name" name="name" placeholder="例如：数理科学部" className="col-span-3" required />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">部门代码</Label>
            <Input id="code" name="code" placeholder="例如：1" className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">描述</Label>
            <Textarea id="description" name="description" placeholder="可选描述信息..." className="col-span-3" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
