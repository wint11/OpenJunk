
'use client'

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { updatePreprint, FormState } from "./actions"
import { useRouter } from "next/navigation"

interface UpdateFormProps {
  preprint: {
    id: string
    title: string
    abstract: string
    authors: string
    pdfUrl: string
  }
}

const initialState: FormState = {
  error: null,
  success: false
}

export function UpdateForm({ preprint }: UpdateFormProps) {
  // Bind the preprint ID to the server action
  const updateWithId = updatePreprint.bind(null, preprint.id)
  const [state, formAction, isPending] = useActionState(updateWithId, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      toast.success("更新申请已提交，等待审核。")
      router.push(`/preprints/${preprint.id}`)
    }
  }, [state.success, router, preprint.id])

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>更新预印本信息</CardTitle>
        <CardDescription>
          请修改您需要更新的信息。提交后需要经过总编审核才会生效。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">论文标题 <span className="text-red-500">*</span></Label>
            <Input id="title" name="title" defaultValue={preprint.title} required />
            {state.error && typeof state.error !== 'string' && state.error.title && (
              <p className="text-sm text-red-500">{state.error.title[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="authors">作者列表 <span className="text-red-500">*</span></Label>
            <Input id="authors" name="authors" defaultValue={preprint.authors} required />
            {state.error && typeof state.error !== 'string' && state.error.authors && (
              <p className="text-sm text-red-500">{state.error.authors[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="abstract">摘要 <span className="text-red-500">*</span></Label>
            <Textarea 
              id="abstract" 
              name="abstract" 
              defaultValue={preprint.abstract}
              rows={6}
              required
            />
            {state.error && typeof state.error !== 'string' && state.error.abstract && (
              <p className="text-sm text-red-500">{state.error.abstract[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">更新论文文件 (PDF/Word) <span className="text-xs text-muted-foreground">(选填，如果不更新请留空)</span></Label>
            <Input 
              id="file" 
              name="file" 
              type="file" 
              accept=".pdf,.doc,.docx" 
            />
            <p className="text-xs text-muted-foreground">当前文件: {preprint.pdfUrl.split('/').pop()}</p>
          </div>

          {state.error && typeof state.error === 'string' && (
            <div className="text-sm text-red-500">{state.error}</div>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
                取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "提交中..." : "提交更新审核"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
