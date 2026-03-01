'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Star, StarOff, AlertTriangle, CheckCircle, Trash2 } from "lucide-react"
import { toggleConferencePaperRecommended, toggleConferencePaperStatus, deleteConferencePaper } from "./actions"

interface PaperActionsProps {
  id: string
  status: string
  isRecommended: boolean
}

export function PaperActions({ id, status, isRecommended }: PaperActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleRecommended = async () => {
    setLoading("recommended")
    try {
        await toggleConferencePaperRecommended(id, isRecommended)
    } catch (error) {
        alert("操作失败")
    } finally {
        setLoading(null)
    }
  }

  const handleStatus = async () => {
    const action = status === 'PUBLISHED' ? '撤稿' : '恢复'
    if (!confirm(`确定要${action}这篇稿件吗？`)) return
    
    setLoading("status")
    try {
        await toggleConferencePaperStatus(id, status)
    } catch (error) {
        alert("操作失败")
    } finally {
        setLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm("确定要彻底删除这篇稿件吗？此操作不可恢复！")) return

    setLoading("delete")
    try {
        await deleteConferencePaper(id)
    } catch (error) {
        alert("操作失败: " + (error as Error).message)
    } finally {
        setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        size="sm" 
        variant="outline"
        className={isRecommended ? "text-muted-foreground" : "text-yellow-600"}
        onClick={handleRecommended}
        disabled={!!loading}
      >
        {isRecommended ? (
          <><StarOff className="w-4 h-4 mr-1" /> 取消精选</>
        ) : (
          <><Star className="w-4 h-4 mr-1" /> 设为精选</>
        )}
      </Button>

      <Button 
        size="sm" 
        variant={status === 'PUBLISHED' ? "destructive" : "default"}
        onClick={handleStatus}
        disabled={!!loading}
      >
        {status === 'PUBLISHED' ? (
          <><AlertTriangle className="w-4 h-4 mr-1" /> 撤稿</>
        ) : (
          <><CheckCircle className="w-4 h-4 mr-1" /> 恢复</>
        )}
      </Button>

      <Button 
        size="sm" 
        variant="outline"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        disabled={!!loading}
      >
        <Trash2 className="w-4 h-4 mr-1" /> 删除
      </Button>
    </div>
  )
}
