
'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { toast } from "sonner"
import { updateAward } from "./actions"
import { useRouter } from "next/navigation"

interface Award {
  id: string
  name: string
  description: string | null
  criteria: string | null
  status: string
}

export function EditAwardForm({ award }: { award: Award }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await updateAward(award.id, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("奖项信息已更新")
        router.refresh()
      }
    } catch (error) {
      toast.error("更新失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-2">
        <Label>奖项名称</Label>
        <Input defaultValue={award.name} disabled />
        <p className="text-xs text-muted-foreground">奖项名称不可修改</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="status">状态</Label>
        <Select name="status" defaultValue={award.status}>
          <SelectTrigger>
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">活跃 (进行中)</SelectItem>
            <SelectItem value="ARCHIVED">归档 (已结束)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">奖项描述</Label>
        <Textarea 
          id="description" 
          name="description" 
          defaultValue={award.description || ""} 
          rows={5}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="criteria">评选标准</Label>
        <Textarea 
          id="criteria" 
          name="criteria" 
          defaultValue={award.criteria || ""} 
          rows={5}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "保存中..." : "保存修改"}
        </Button>
      </div>
    </form>
  )
}
