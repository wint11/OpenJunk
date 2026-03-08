'use client'

import { Button } from "@/components/ui/button"
import { Check, X, Loader2, Award, Edit } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { approveApplication, rejectApplication } from "./actions"
import { ReviewDialog } from "./review-dialog"

interface PrizeLevel {
  id: string
  name: string
  color: string
  order: number
}

interface ApplicationActionsProps {
  id: string
  status: string
  nomineeName: string
  prizeLevels: PrizeLevel[]
  reviewComment?: string | null
  isPublished?: boolean
  onSuccess?: () => void
}

export function ApplicationActions({ 
  id, 
  status, 
  nomineeName,
  prizeLevels,
  reviewComment,
  isPublished = false,
  onSuccess 
}: ApplicationActionsProps) {
  const [loading, setLoading] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  // 判断是否已经评审过（状态不是 PENDING/REVIEWING）
  const isReviewed = status !== 'PENDING' && status !== 'REVIEWING'

  const handleQuickApprove = async () => {
    if (confirm("确定通过此申请吗？")) {
      setLoading(true)
      const res = await approveApplication(id)
      setLoading(false)
      if (res.error) toast.error(res.error)
      else {
        toast.success("已通过申请")
        onSuccess?.()
      }
    }
  }

  const handleQuickReject = async () => {
    if (confirm("确定驳回此申请吗？")) {
      setLoading(true)
      const res = await rejectApplication(id)
      setLoading(false)
      if (res.error) toast.error(res.error)
      else {
        toast.success("已驳回申请")
        onSuccess?.()
      }
    }
  }

  // 查找对应的奖项等级
  const prizeLevel = prizeLevels.find(p => p.id === status)

  return (
    <>
      {isReviewed ? (
        <div className="flex items-center gap-2">
          {prizeLevel ? (
            <span 
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ 
                backgroundColor: `${prizeLevel.color}20`,
                color: prizeLevel.color 
              }}
            >
              {prizeLevel.name}
              {isPublished && " (已发布)"}
            </span>
          ) : status === 'REJECTED' ? (
            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
              不予授奖
              {isPublished && " (已发布)"}
            </span>
          ) : (
            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
              {status}
            </span>
          )}
          {!isPublished && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0"
              onClick={() => setReviewOpen(true)}
              title="修改评审"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          {/* 快速通过/驳回按钮 */}
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleQuickApprove}
            disabled={loading}
            title="快速通过"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleQuickReject}
            disabled={loading}
            title="快速驳回"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </Button>
          
          {/* 详细评审按钮 */}
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => setReviewOpen(true)}
            disabled={loading}
            title="详细评审"
          >
            <Award className="h-4 w-4 mr-1" />
            评审
          </Button>
        </div>
      )}

      <ReviewDialog
        applicationId={id}
        nomineeName={nomineeName}
        prizeLevels={prizeLevels}
        currentStatus={status}
        currentComment={reviewComment}
        isPublished={isPublished}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onSuccess={() => onSuccess?.()}
      />
    </>
  )
}
