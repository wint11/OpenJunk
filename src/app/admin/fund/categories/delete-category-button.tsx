'use client'

import { useTransition } from "react"
import { deleteFundCategory } from "./actions"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function DeleteCategoryButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm("确定要删除该基金大类吗？此操作不可恢复。")) return

    startTransition(async () => {
      const result = await deleteFundCategory(id)
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
