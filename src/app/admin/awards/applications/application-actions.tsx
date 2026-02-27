
'use client'

import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { approveApplication, rejectApplication } from "./actions"

export function ApplicationActions({ id, status }: { id: string, status: string }) {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    if (confirm("确定通过此申请吗？")) {
      setLoading(true)
      const res = await approveApplication(id)
      setLoading(false)
      if (res.error) toast.error(res.error)
      else toast.success("已通过申请")
    }
  }

  const handleReject = async () => {
    if (confirm("确定驳回此申请吗？")) {
      setLoading(true)
      const res = await rejectApplication(id)
      setLoading(false)
      if (res.error) toast.error(res.error)
      else toast.success("已驳回申请")
    }
  }

  if (status !== 'PENDING') {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {status === 'APPROVED' ? '已通过' : '已驳回'}
      </span>
    )
  }

  return (
    <div className="flex gap-2">
      <Button 
        size="sm" 
        variant="outline" 
        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        onClick={handleApprove}
        disabled={loading}
        title="通过"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleReject}
        disabled={loading}
        title="驳回"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      </Button>
    </div>
  )
}
