'use client'

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { revokeApplication } from "./actions"
import { toast } from "sonner"
import { Undo2 } from "lucide-react"

export function RevokeButton({ applicationId }: { applicationId: string }) {
  const [state, formAction, isPending] = useActionState(revokeApplication, { success: false, message: '' })

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <form action={formAction}>
      <input type="hidden" name="applicationId" value={applicationId} />
      <Button variant="outline" disabled={isPending} className="text-muted-foreground hover:text-destructive hover:border-destructive">
        <Undo2 className="mr-2 h-4 w-4" />
        {isPending ? "撤销中..." : "撤销立项状态"}
      </Button>
    </form>
  )
}