'use client'

import { useState, useActionState, useEffect } from "react"
import { createFundCategory } from "./actions"
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

// Define the state type based on the action return type
type ActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
} | null

export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false)
  // Initialize state as null or with default values matching the type
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createFundCategory, null)

  useEffect(() => {
    if (state?.success && open) {
      setOpen(false)
    }
  }, [state, open])

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 新建基金
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新建基金大类</DialogTitle>
          <DialogDescription>
            创建一个新的基金大类（如：国家自然科学基金），之后可以指派管理员进行管理。
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} className="grid gap-4 py-4">
          {state?.message && !state.success && (
            <div className="text-red-500 text-sm mb-2">{state.message}</div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">基金名称</Label>
            <Input id="name" name="name" placeholder="例如：国家自然科学基金" className="col-span-3" required />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">唯一代码</Label>
            <Input id="code" name="code" placeholder="例如：NSFC" className="col-span-3" required />
            <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
              仅限大写字母和数字
            </div>
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
