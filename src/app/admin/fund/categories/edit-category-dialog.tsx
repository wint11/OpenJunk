'use client'

import { useState, useActionState, useEffect } from "react"
import { updateFundCategory } from "./actions"
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
import { Pencil, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Define the state type based on the action return type
type ActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
} | null

interface EditCategoryDialogProps {
  category: {
    id: string
    name: string
    code: string
    description: string | null
  }
}

export function EditCategoryDialog({ category }: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  
  // Wrap the server action to pass the ID
  const updateWithId = updateFundCategory.bind(null, category.id)
  
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateWithId, null)

  useEffect(() => {
    if (state?.success && open) {
      setOpen(false)
      toast.success(state.message || "更新成功")
    } else if (state?.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑基金大类</DialogTitle>
          <DialogDescription>
            修改基金大类的基本信息。
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">基金名称</Label>
            <Input 
              id="name" 
              name="name" 
              defaultValue={category.name} 
              placeholder="例如：国家自然科学基金" 
              className="col-span-3" 
              required 
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">唯一代码</Label>
            <Input 
              id="code" 
              name="code" 
              defaultValue={category.code} 
              placeholder="例如：NSFC" 
              className="col-span-3" 
              required 
            />
            <div className="col-start-2 col-span-3 text-xs text-muted-foreground">
              仅限大写字母和数字
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">描述</Label>
            <Textarea 
              id="description" 
              name="description" 
              defaultValue={category.description || ""} 
              placeholder="可选描述信息..." 
              className="col-span-3" 
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存修改"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
