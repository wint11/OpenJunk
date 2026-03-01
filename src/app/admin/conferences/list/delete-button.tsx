'use client'

import { Button } from "@/components/ui/button"
import { deleteConference } from "./actions"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

export function DeleteConferenceButton({ id, disabled }: { id: string, disabled?: boolean }) {
  async function handleDelete() {
    if (!confirm("确定要删除这个会议吗？此操作无法撤销。")) return
    try {
      await deleteConference(id)
      toast.success("会议已删除")
    } catch (error) {
       toast.error("删除失败，请确保该会议下没有论文或参与者")
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={disabled}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
