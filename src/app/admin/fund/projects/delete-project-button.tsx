'use client'

import { useTransition } from "react"
import { deleteFund } from "./actions"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function DeleteProjectButton({ id, title }: { id: string, title: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm(`警告：确定要删除项目 "${title}" 吗？\n\n此操作将同时删除该项目下所有的申请记录和评审记录！\n\n此操作极其危险且不可恢复！`)) return

    startTransition(async () => {
      const result = await deleteFund(id)
      if (result.success) {
        toast.success(result.message || "删除成功")
      } else {
        toast.error(result.message || "删除失败")
      }
    })
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete} 
      disabled={isPending}
      className="text-destructive hover:text-destructive/90"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
