
'use client'

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { submitPreprint, FormState } from "./actions"
import { useRouter } from "next/navigation"

const initialState: FormState = {
  error: null,
  success: false
}

export default function PreprintSubmitPage() {
  const [state, formAction, isPending] = useActionState(submitPreprint, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      toast.success("预印本发布成功！")
      router.push("/preprints")
    }
  }, [state.success, router])

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">发布预印本</h1>
        <p className="text-muted-foreground mt-2">
          快速分享您的研究成果，无需繁琐的审稿流程。
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>论文信息</CardTitle>
          <CardDescription>
            请填写论文的基本信息和文件链接。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">论文标题 <span className="text-red-500">*</span></Label>
              <Input id="title" name="title" placeholder="请输入论文标题" required />
              {state.error && typeof state.error !== 'string' && state.error.title && (
                <p className="text-sm text-red-500">{state.error.title[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="authors">作者列表 <span className="text-red-500">*</span></Label>
              <Input id="authors" name="authors" placeholder="多个作者请用逗号分隔" required />
              {state.error && typeof state.error !== 'string' && state.error.authors && (
                <p className="text-sm text-red-500">{state.error.authors[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="abstract">摘要 <span className="text-red-500">*</span></Label>
              <Textarea 
                id="abstract" 
                name="abstract" 
                placeholder="请输入论文摘要..." 
                rows={6}
                required
              />
              {state.error && typeof state.error !== 'string' && state.error.abstract && (
                <p className="text-sm text-red-500">{state.error.abstract[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">论文文件 (PDF/Word) <span className="text-red-500">*</span></Label>
              <Input 
                id="file" 
                name="file" 
                type="file" 
                accept=".pdf,.doc,.docx" 
                required 
              />
              <p className="text-xs text-muted-foreground">请上传您的论文文件，支持 PDF 或 Word 格式。</p>
            </div>

            {state.error && typeof state.error === 'string' && (
              <div className="text-sm text-red-500">{state.error}</div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? "发布中..." : "立即发布"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
