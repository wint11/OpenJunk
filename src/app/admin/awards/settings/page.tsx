
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default async function AwardSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { managedAward: true }
  })

  // If Super Admin, this page might need to be dynamic /admin/awards/[id]/settings
  // But for now, let's assume this page is for the logged-in Award Admin
  // Or if Super Admin visits this, maybe redirect to list?
  
  if (session.user.role === 'SUPER_ADMIN') {
      return (
          <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">奖项设置</h1>
              <p className="text-muted-foreground">超级管理员请通过“奖项列表”选择具体奖项进行管理。</p>
              {/* In future, we can list awards here or redirect */}
          </div>
      )
  }

  const award = user?.managedAward

  if (!award) {
    return <div>您没有管理的奖项</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">奖项设置</h1>
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>奖项名称</Label>
            <Input defaultValue={award.name} disabled />
            <p className="text-xs text-muted-foreground">如需修改名称请联系超级管理员</p>
          </div>
          <div className="grid gap-2">
            <Label>奖项描述</Label>
            <Textarea defaultValue={award.description || ""} disabled />
          </div>
          <div className="grid gap-2">
            <Label>评选标准</Label>
            <Textarea defaultValue={award.criteria || ""} disabled />
          </div>
          
          <div className="pt-4">
             <Button disabled>保存修改 (开发中)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
