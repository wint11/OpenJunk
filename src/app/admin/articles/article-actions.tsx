'use client'

import { Button } from "@/components/ui/button"
import { 
    updateArticleStatus, 
    approveDeletion, 
    rejectDeletion,
    approveCoverUpdate,
    rejectCoverUpdate
} from "./actions"
import { useTransition } from "react"
import { Check, X, Trash2, Image as ImageIcon, Eye } from "lucide-react"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ArticleActions({ id, status, pendingCoverUrl }: { id: string, status: string, pendingCoverUrl?: string | null }) {
  const [isPending, startTransition] = useTransition()

  if (status === 'PENDING_DELETION') {
      return (
        <div className="flex gap-2">
            <span className="text-xs font-bold text-red-500 flex items-center mr-2">申请删除</span>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            disabled={isPending}
                            onClick={() => startTransition(() => approveDeletion(id))}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>同意删除</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            disabled={isPending}
                            onClick={() => startTransition(() => rejectDeletion(id))}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>拒绝删除</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      )
  }

  if (pendingCoverUrl) {
      return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-blue-500 flex items-center">
                    <ImageIcon className="mr-1 h-3 w-3" /> 申请换封面
                 </span>
                 <a href={pendingCoverUrl} target="_blank" className="text-xs underline text-blue-500">查看</a>
            </div>
            <div className="flex gap-2">
                <Button 
                    variant="default" 
                    size="sm" 
                    className="h-7 px-2 bg-blue-600 hover:bg-blue-700"
                    disabled={isPending}
                    onClick={() => startTransition(() => approveCoverUpdate(id))}
                >
                    同意
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2"
                    disabled={isPending}
                    onClick={() => startTransition(() => rejectCoverUpdate(id))}
                >
                    拒绝
                </Button>
            </div>
        </div>
      )
  }

  if (status === 'PUBLISHED') {
    return (
      <div className="flex gap-2">
        <Link href={`/admin/articles/${id}`}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
          >
            <Eye className="mr-1 h-4 w-4" /> 详情
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          disabled={isPending}
          onClick={() => startTransition(() => updateArticleStatus(id, 'REJECTED'))}
        >
          <X className="mr-1 h-4 w-4" /> 下架
        </Button>
      </div>
    )
  }

  if (status === 'REJECTED') {
    return (
      <div className="flex gap-2">
        <Link href={`/admin/articles/${id}`}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
          >
            <Eye className="mr-1 h-4 w-4" /> 详情
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={isPending}
          onClick={() => startTransition(() => updateArticleStatus(id, 'PUBLISHED'))}
        >
          <Check className="mr-1 h-4 w-4" /> 重新上架
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Link href={`/admin/articles/${id}`}>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
        >
          <Eye className="mr-1 h-4 w-4" /> 详情
        </Button>
      </Link>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
        disabled={isPending}
        onClick={() => startTransition(() => updateArticleStatus(id, 'PUBLISHED'))}
      >
        <Check className="mr-1 h-4 w-4" /> 通过
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
        disabled={isPending}
        onClick={() => startTransition(() => updateArticleStatus(id, 'REJECTED'))}
      >
        <X className="mr-1 h-4 w-4" /> 拒绝
      </Button>
    </div>
  )
}
