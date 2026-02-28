'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { submitApplication } from "../../actions"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaperSearch } from "./paper-search"

export function ApplyForm({ fund, departments }: { fund: any, departments: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [paperIds, setPaperIds] = useState<string[]>([])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    const formData = new FormData(event.currentTarget)
    formData.append("fundId", fund.id)
    formData.append("paperIds", JSON.stringify(paperIds))

    try {
      // Call server action directly
      const response = await submitApplication(null, formData)
      setResult(response)
    } catch (error) {
      setResult({ success: false, message: "发生未知错误，请重试" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result?.success) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
               <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-green-800 dark:text-green-300">申报提交成功！</h3>
              <p className="text-green-700 dark:text-green-400">您的申请已成功受理。</p>
            </div>
            
            <div className="bg-background p-4 rounded-lg border w-full max-w-sm mx-auto my-4 shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">申请编号 (Serial No)</p>
              <p className="font-mono text-xl font-bold tracking-wider">{result.serialNo}</p>
            </div>
            
            <p className="text-xs text-muted-foreground max-w-xs">
              请务必记录此编号，它是查询申请状态的唯一凭证。
            </p>
            
            <Button variant="outline" className="mt-4 w-full max-w-xs" onClick={() => window.location.href = '/fund'}>
              返回基金列表
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-muted/60">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {result?.success === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>提交失败</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="departmentId" className="text-base font-semibold">
                申报学部/部门 <span className="text-red-500">*</span>
              </Label>
              <Select name="departmentId" required>
                <SelectTrigger>
                  <SelectValue placeholder="请选择申报部门" />
                </SelectTrigger>
                <SelectContent>
                  {departments && departments.length > 0 ? departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                       {dept.code} - {dept.name}
                    </SelectItem>
                  )) : (
                    <SelectItem value="none" disabled>暂无可选部门</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {result?.errors?.departmentId && <p className="text-xs text-red-500">{result.errors.departmentId[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantName" className="text-base font-semibold">
                申请人姓名 <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="applicantName" 
                name="applicantName" 
                required 
                placeholder="请输入您的姓名" 
                className="h-11"
              />
              {result?.errors?.applicantName && <p className="text-xs text-red-500">{result.errors.applicantName[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">
                项目名称 <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="title" 
                name="title" 
                required 
                placeholder="请输入项目全称" 
                className="h-11"
              />
              {result?.errors?.title && <p className="text-xs text-red-500">{result.errors.title[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                项目简介 <span className="text-red-500">*</span>
              </Label>
              <Textarea 
                id="description" 
                name="description" 
                required 
                placeholder="简要描述项目的研究背景、目标和内容（不少于20字）" 
                className="min-h-[150px] resize-y text-base"
              />
              {result?.errors?.description && <p className="text-xs text-red-500">{result.errors.description[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements" className="text-base font-semibold">
                已有成果 (可选)
              </Label>
              <PaperSearch onSelect={(papers) => setPaperIds(papers.map(p => p.id))} />
              <Textarea 
                id="achievements" 
                name="achievements" 
                placeholder="除了关联上述论文外，您还可以补充列出其他代表性成果（专利、奖项等）" 
                className="min-h-[100px] resize-y text-base mt-2"
              />
              <p className="text-xs text-muted-foreground">支持 Markdown 格式，或简单的文本列表。</p>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full h-11 text-lg font-medium shadow-md" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 正在提交...
                </>
              ) : (
                "确认提交申请"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              提交即代表您承诺所填信息真实有效。
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
