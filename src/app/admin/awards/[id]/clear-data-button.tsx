'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { clearAwardData } from "./actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ClearDataButtonProps {
    awardId: string
    awardName: string
}

export function ClearDataButton({ awardId, awardName }: ClearDataButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleClear = async () => {
        setLoading(true)
        try {
            const result = await clearAwardData(awardId)
            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (e) {
            toast.error("操作失败")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={loading} size="sm">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    清空数据
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        危险操作警告
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div>
                            此操作将<strong>永久删除</strong>奖项 &quot;{awardName}&quot; 的所有数据，包括：
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>所有申请记录</li>
                                <li>所有评审记录和评审意见</li>
                                <li>所有周期设置</li>
                                <li>所有赛道设置</li>
                                <li>所有奖项等级设置</li>
                            </ul>
                            <div className="mt-4">
                                <strong>注意：奖项基本信息（名称、描述等）将保留。</strong>
                            </div>
                            <div className="mt-4">
                                数据一旦删除将无法恢复！请确认您真的要这样做吗？
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        确认清空
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
