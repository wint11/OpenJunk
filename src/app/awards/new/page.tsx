'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { createAwardAndAdmin } from "./actions"
import { useRouter } from "next/navigation"

export default function CreateAwardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [awardName, setAwardName] = useState("")

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await createAwardAndAdmin(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("奖项创办成功！3秒后自动进入管理后台...", { duration: 3000 })
        router.refresh()
        setTimeout(() => {
          router.push("/admin/awards/applications") // Redirect to award applications
          window.location.href = "/admin/awards/applications"
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
        <h1 className="text-3xl font-bold tracking-tight">创办奖项</h1>
        <p className="text-muted-foreground mt-2">
          设立一个新的学术垃圾奖项，并注册关联的管理账号。
        </p>
      </div>

      <form action={handleSubmit}>
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>奖项基本信息</CardTitle>
              <CardDescription>
                填写奖项的详细资料，这些信息将展示在奖项主页上。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">奖项名称 <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  name="name" 
                  required 
                  placeholder="请输入奖项名称 (如: OpenJunk 终身成就奖)" 
                  value={awardName}
                  onChange={(e) => setAwardName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">奖项描述 <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  placeholder="简要介绍奖项的宗旨、历史和影响力"
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="criteria">评选标准 <span className="text-red-500">*</span></Label>
                <Textarea
                  id="criteria"
                  name="criteria"
                  required
                  placeholder="详细列出评选标准、提名资格等"
                  rows={6}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cover">奖杯/Logo图片</Label>
                <Input id="cover" name="cover" type="file" accept="image/*" />
                <p className="text-xs text-muted-foreground">建议尺寸: 800x600, 支持 JPG, PNG 格式</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>管理账号注册</CardTitle>
              <CardDescription>
                创建一个用于管理该奖项的管理员账号。创办成功后，请使用此账号登录。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="userName">管理员姓名</Label>
                <Input 
                  id="userName" 
                  name="userName" 
                  value={awardName ? `${awardName}组委会` : ""} 
                  readOnly 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">自动生成，格式为：奖项名 + 组委会</p>
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
