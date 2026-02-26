'use client'

import { useState, useActionState, useEffect } from "react"
import { updateFundAdmin } from "./actions"
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
import { Pencil, Loader2 } from "lucide-react"

interface EditAdminDialogProps {
  admin: {
    id: string
    name: string | null
    email: string
    fundAdminCategories: { id: string, name: string }[]
  }
  categories: { id: string, name: string }[]
}

export function EditAdminDialog({ admin, categories }: EditAdminDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(updateFundAdmin, null)

  // Determine current category ID (assuming single category for now based on UI)
  const currentCategoryId = admin.fundAdminCategories.length > 0 ? admin.fundAdminCategories[0].id : ""

  useEffect(() => {
    if (state?.success && open) {
      setOpen(false)
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
          <DialogTitle>编辑管理员信息</DialogTitle>
          <DialogDescription>
            修改管理员姓名或调整其负责的基金大类。
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} className="grid gap-4 py-4">
          <input type="hidden" name="id" value={admin.id} />
          
          {state?.message && !state.success && (
            <div className="text-red-500 text-sm mb-2">{state.message}</div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email-edit" className="text-right">邮箱</Label>
            <Input id="email-edit" value={admin.email} disabled className="col-span-3 bg-muted" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name-edit" className="text-right">姓名</Label>
            <Input 
                id="name-edit" 
                name="name" 
                defaultValue={admin.name || ""} 
                className="col-span-3" 
                required 
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">管理权限</Label>
            <div className="col-span-3">
              <Select name="categoryId" required defaultValue={currentCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择基金大类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
