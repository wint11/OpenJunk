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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, AlertCircle, CheckCircle2, FileSpreadsheet } from "lucide-react"
import { importFunds } from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

const initialState = {
  success: false,
  message: '',
  errors: [] as string[]
}

export function ImportFundsDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(importFunds, initialState)

  useEffect(() => {
    if (state.success && state.errors?.length === 0) {
      toast.success(state.message)
      setOpen(false)
    } else if (state.success && state.errors && state.errors.length > 0) {
      toast.warning(state.message)
      // Don't close if there are partial errors so user can see them
    } else if (!state.success && state.message) {
      toast.error(state.message)
    }
  }, [state, setOpen])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" /> 导入 Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>导入基金项目</DialogTitle>
          <DialogDescription>
            请上传符合格式的 Excel 文件 (.xlsx)。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertTitle>Excel 格式要求</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-2">
              <p>第一行必须包含以下列名（顺序不限）：</p>
              <ul className="list-disc list-inside mt-1 font-mono">
                <li>项目名称</li>
                <li>年度 (数字, 如 2026)</li>
                <li>基金代码 (如 NSFC)</li>
                <li>开始时间 (yyyy-MM-dd)</li>
                <li>结束时间 (yyyy-MM-dd)</li>
                <li>指南内容 (选填)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <form id="import-form" action={formAction} className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file">选择文件</Label>
              <Input id="file" name="file" type="file" accept=".xlsx, .xls" required />
            </div>
          </form>

          {state.errors && state.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>导入遇到问题</AlertTitle>
              <AlertDescription>
                <div className="mt-2 font-medium">{state.message}</div>
                <ScrollArea className="h-[150px] w-full rounded-md border p-2 mt-2 bg-background text-xs">
                  {state.errors.map((error, index) => (
                    <div key={index} className="mb-1 text-red-500">
                      {error}
                    </div>
                  ))}
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button type="submit" form="import-form" disabled={isPending}>
            {isPending ? "导入中..." : "开始导入"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
