'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { createJournalAndAdmin } from "./actions"
import { useRouter } from "next/navigation"

export default function CreateJournalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [journalName, setJournalName] = useState("")

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await createJournalAndAdmin(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("期刊创办成功！3秒后自动进入管理后台...", { duration: 3000 })
        // Force refresh session/router to update UI components like navbar avatar
        router.refresh()
        setTimeout(() => {
          router.push("/admin/journals")
          // Ensure router.refresh() happens or re-fetch session if using next-auth hook
          window.location.href = "/admin/journals"
        }, 3000)
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "创办失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10 mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">创办期刊</h1>
        <p className="text-muted-foreground mt-2">
          创建一个新的期刊，并注册关联的管理账号。
        </p>
      </div>

      <form action={handleSubmit}>
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>期刊基本信息</CardTitle>
              <CardDescription>
                填写期刊的详细资料，这些信息将展示在期刊主页上。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">期刊名称 <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  name="name" 
                  required 
                  placeholder="请输入期刊名称" 
                  value={journalName}
                  onChange={(e) => setJournalName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">期刊描述 <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  placeholder="简要介绍期刊的研究领域、目标和范围"
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cover">封面图片</Label>
                <Input id="cover" name="cover" type="file" accept="image/*" />
                <p className="text-xs text-muted-foreground">建议尺寸: 800x600, 支持 JPG, PNG 格式</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="guidelines">投稿指南 (文本)</Label>
                <Textarea
                  id="guidelines"
                  name="guidelines"
                  placeholder="请输入详细的投稿指南内容"
                  rows={6}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="guidelinesFile">投稿指南 (文件)</Label>
                <Input id="guidelinesFile" name="guidelinesFile" type="file" accept=".pdf,.doc,.docx" />
                <p className="text-xs text-muted-foreground">可选，上传 PDF 或 Word 格式的投稿指南文档</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>管理账号注册</CardTitle>
              <CardDescription>
                创建一个用于管理该期刊的管理员账号。创办成功后，请使用此账号登录。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="userName">管理员姓名</Label>
                <Input 
                  id="userName" 
                  name="userName" 
                  value={journalName ? `${journalName}主编` : ""} 
                  readOnly 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">自动生成，格式为：期刊名 + 主编</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="userEmail">登录邮箱 <span className="text-red-500">*</span></Label>
                <Input id="userEmail" name="userEmail" type="email" required placeholder="name@example.com" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="userPassword">登录密码 <span className="text-red-500">*</span></Label>
                <Input id="userPassword" name="userPassword" type="password" required placeholder="设置登录密码" minLength={6} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "提交中..." : "提交创办申请"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
