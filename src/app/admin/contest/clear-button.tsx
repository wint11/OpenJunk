'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { clearContestData } from "./actions"
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

export function ClearButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleClear = async () => {
        setLoading(true)
        try {
            const result = await clearContestData()
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
                <Button variant="destructive" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    一键清空所有数据
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        危险操作警告
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        此操作将<strong>永久删除</strong>所有参赛作品（PPT文件、预览图）和所有解说录音（音频文件），以及数据库中的所有相关记录。
                        <br /><br />
                        数据一旦删除将无法恢复！请确认您真的要这样做吗？
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
