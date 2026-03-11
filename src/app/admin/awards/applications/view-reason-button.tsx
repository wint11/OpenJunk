"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText } from "lucide-react"

interface ViewReasonButtonProps {
  reason: string | null
  nomineeName: string | null
}

export function ViewReasonButton({ reason, nomineeName }: ViewReasonButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <FileText className="mr-2 h-4 w-4" />
          查看理由
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>申请理由 - {nomineeName || '未命名'}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-relaxed">
          {reason || "申请人未提供详细理由。"}
        </div>
      </DialogContent>
    </Dialog>
  )
}
