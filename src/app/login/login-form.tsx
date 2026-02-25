'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { login } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await login(formData)
      
      if (result.success && result.redirectTo) {
        toast.success("登录成功")
        router.push(result.redirectTo)
        router.refresh()
      } else {
        toast.error(result.error || "登录失败")
      }
    } catch (error) {
      console.error(error)
      toast.error("发生未知错误，请检查控制台")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl bg-background/60 backdrop-blur-xl">
      <CardHeader className="space-y-4 text-center pb-8">
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <Trash2 className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">OpenJunk</CardTitle>
            <CardDescription className="text-base">
              欢迎回到学术垃圾场
            </CardDescription>
        </div>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">账号</Label>
            <Input 
                id="email" 
                name="email" 
                type="text" 
                placeholder="请输入您的账号" 
                required 
                disabled={loading} 
                className="h-11"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="password">密码</Label>
                <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground" type="button">
                    忘记密码?
                </Button>
            </div>
            <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                disabled={loading}
                className="h-11" 
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-4">
          <Button className="w-full h-11 text-base font-medium shadow-lg hover:shadow-primary/20 transition-all" type="submit" disabled={loading}>
            {loading ? "登录中..." : "立即登录"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            未注册账号？ <Button variant="link" className="p-0 h-auto text-xs underline" type="button">联系管理员</Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}