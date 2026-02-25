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
    status: string
  }
}

export function JournalDialog({ mode, journal }: JournalDialogProps) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    try {
      if (mode === "create") {
        await createJournal(formData)
        toast.success("期刊创建成功")
      } else {
        if (!journal?.id) return
        await updateJournal(journal.id, formData)
        toast.success("期刊更新成功")
      }
      setOpen(false)
    } catch (error) {
      toast.error("操作失败")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "create" ? "default" : "outline"} size={mode === "edit" ? "sm" : "default"}>
          {mode === "create" ? "创建期刊" : "编辑"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "创建新期刊" : "编辑期刊"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "填写以下信息创建一个新的期刊。" : "修改期刊信息。"}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                名称
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={journal?.name}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                描述
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={journal?.description || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                状态
              </Label>
              <Select name="status" defaultValue={journal?.status || "ACTIVE"}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">活跃</SelectItem>
                  <SelectItem value="ARCHIVED">归档</SelectItem>
                </SelectContent>
              </Select>
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
