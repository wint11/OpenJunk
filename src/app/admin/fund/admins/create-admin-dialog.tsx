'use client'

import { useState, useActionState, useEffect } from "react"
import { createFundAdmin } from "./actions"
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

export function CreateAdminDialog({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createFundAdmin, null)

  useEffect(() => {
    if (state?.success && open) {
      setOpen(false)
    }
  }, [state, open])

  const handleSubmit = async (formData: FormData) => {
    // useActionState handles pending state automatically
    await formAction(formData)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 添加管理员
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加基金管理员</DialogTitle>
          <DialogDescription>
            创建一个新的管理员账号，并分配其负责的基金大类。
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="grid gap-4 py-4">
          {state?.message && !state.success && (
            <div className="text-red-500 text-sm mb-2">{state.message}</div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">邮箱</Label>
            <Input id="email" name="email" type="email" className="col-span-3" required />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">密码</Label>
            <Input id="password" name="password" type="password" className="col-span-3" required minLength={6} />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">管理权限</Label>
            <div className="col-span-3">
              <Select name="categoryId" required>
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
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "创建账号"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
