'use client'

import { Button } from "@/components/ui/button"
import { deleteJournal } from "./actions"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

export function DeleteJournalButton({ id, disabled }: { id: string, disabled?: boolean }) {
  async function handleDelete() {
    if (!confirm("确定要删除这个期刊吗？此操作无法撤销。")) return
    try {
      await deleteJournal(id)
      toast.success("期刊已删除")
    } catch (error) {
       toast.error("删除失败，请确保该期刊下没有论文或编辑")
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={disabled}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
