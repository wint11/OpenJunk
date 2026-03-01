'use client'

import { useState, useActionState, useEffect } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { reviewApplication } from "./actions"
import { toast } from "sonner"
import { Check, X, Gavel } from "lucide-react"

export function ReviewDialog({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false)
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null)
  const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
    formData.set('action', actionType || '')
    return await reviewApplication(prev, formData)
  }, { success: false, message: '' })

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      setOpen(false)
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state, setOpen])

  const handleOpen = (type: 'APPROVE' | 'REJECT') => {
    setActionType(type)
    setOpen(true)
  }

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={() => handleOpen('APPROVE')} className="bg-green-600 hover:bg-green-700">
          <Check className="mr-2 h-4 w-4" /> 批准立项
        </Button>
        <Button onClick={() => handleOpen('REJECT')} variant="destructive">
          <X className="mr-2 h-4 w-4" /> 驳回申请
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen} modal={false}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{actionType === 'APPROVE' ? '批准立项' : '驳回申请'}</DialogTitle>
            <DialogDescription>
              {actionType === 'APPROVE' 
                ? '确认批准该项目立项？这将更新项目状态为“已立项”。' 
                : '确认驳回该申请？这将更新项目状态为“未立项”。'}
            </DialogDescription>
          </DialogHeader>

          <form id="review-form" action={formAction} className="space-y-4 py-4">
            <input type="hidden" name="applicationId" value={applicationId} />
            
            <div className="space-y-2">
              <Label htmlFor="comments">审核意见 (可选)</Label>
              <Textarea 
                id="comments" 
                name="comments" 
                placeholder={actionType === 'APPROVE' ? "请输入立项理由或意见..." : "请输入驳回理由..."}
                defaultValue={actionType === 'APPROVE' ? "经审核，该项目符合立项条件，予以立项。" : "经审核，该项目不符合条件，不予立项。"}
              />
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button 
              type="submit" 
              form="review-form" 
              disabled={isPending}
              variant={actionType === 'REJECT' ? 'destructive' : 'default'}
              className={actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isPending ? "处理中..." : "确认提交"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
