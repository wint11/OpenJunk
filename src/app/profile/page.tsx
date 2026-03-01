import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Shield, Award } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PasswordForm } from "./password-form"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Verify user exists in DB (handle stale sessions after DB reset)
  const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        managedJournal: true,
        reviewerJournals: true,
        fundAdminCategories: true
      }
  })
  if (!dbUser) {
      // redirect("/api/auth/signout") // Loop issue
      return <div>User not found. Please logout.</div>
  }

  const role = session.user.role ?? ""
  
  // Determine specific role title
  let roleTitle = "普通读者"
  if (role === 'SUPER_ADMIN') {
      roleTitle = "平台总编"
  } else if (role === 'ADMIN') {
      if (dbUser.fundAdminCategories.length > 0) {
          const categoryNames = dbUser.fundAdminCategories.map(c => c.name).join(', ')
          roleTitle = `基金管理员 (${categoryNames})`
      } else if (dbUser.managedJournal) {
          roleTitle = `期刊主编 (${dbUser.managedJournal.name})`
      } else {
          roleTitle = "期刊管理员 (未分配)"
      }
  } else if (role === 'REVIEWER') {
      if (dbUser.reviewerJournals.length > 0) {
          const journalNames = dbUser.reviewerJournals.map(j => j.name).join(', ')
          roleTitle = `责任编辑 (${journalNames})`
      } else {
          roleTitle = "责任编辑 (未分配)"
      }
  } else if (role === 'AUTHOR') {
      roleTitle = "投稿作者"
  }

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">个人中心</h1>
      </div>

      <Tabs defaultValue="profile" className="flex-1 flex gap-6 overflow-hidden">
        <TabsList className="flex flex-col w-64 h-full justify-start space-y-2 bg-muted/30 p-4 rounded-lg border">
           <div className="w-full pb-4 mb-2 border-b">
              <div className="flex items-center gap-3 px-2">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback>{session.user.name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                </div>
              </div>
           </div>

           <TabsTrigger value="profile" className="w-full justify-start px-3 py-2 h-auto data-[state=active]:bg-background">
              <User className="mr-2 h-4 w-4" />
              基本资料
           </TabsTrigger>
           <TabsTrigger value="security" className="w-full justify-start px-3 py-2 h-auto data-[state=active]:bg-background">
              <Shield className="mr-2 h-4 w-4" />
              账号安全
           </TabsTrigger>

           <div className="mt-auto pt-4 border-t w-full">
              <form action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}>
                <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" type="submit">
                  <LogOut className="mr-2 h-4 w-4" /> 退出登录
                </Button>
              </form>
           </div>
        </TabsList>
        
        <div className="flex-1 h-full overflow-hidden pb-10">
           <TabsContent value="profile" className="mt-0 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>基本资料</CardTitle>
                  <CardDescription>查看您的个人信息和荣誉记录</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 flex-1 overflow-y-auto">
                  {/* User Info Section */}
                  <div className="flex items-start space-x-6 pb-6 border-b">
                    <Avatar className="h-24 w-24 border-2 border-muted">
                      <AvatarImage src={session.user.image || ""} />
                      <AvatarFallback className="text-2xl">{session.user.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-4 flex-1">
                      <div className="grid gap-4 max-w-xl">
                        <div className="grid grid-cols-4 items-center gap-4">
                           <Label className="text-right text-muted-foreground">昵称</Label>
                           <div className="col-span-3 font-medium">{session.user.name}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                           <Label className="text-right text-muted-foreground">角色</Label>
                           <div className="col-span-3"><Badge variant="secondary">{roleTitle}</Badge></div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                           <Label className="text-right text-muted-foreground">邮箱</Label>
                           <div className="col-span-3 font-mono text-sm">{session.user.email}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                           <Label className="text-right text-muted-foreground">用户 ID</Label>
                           <div className="col-span-3 font-mono text-sm text-muted-foreground">{session.user.id}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Honors Section */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">我的荣誉</h3>
                     </div>
                     <div className="bg-muted/30 rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground border border-dashed">
                        <Award className="h-12 w-12 mb-3 opacity-20" />
                        <p>暂无荣誉记录</p>
                        <p className="text-sm mt-1">当您获得奖项时，将在此处展示。</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
           </TabsContent>

           <TabsContent value="security" className="mt-0 h-full">
              <Card className="h-full flex flex-col">
                  <CardHeader>
                      <CardTitle>账号安全</CardTitle>
                      <CardDescription>保护您的账号安全</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1 overflow-y-auto">
                      <div className="space-y-4">
                          <h3 className="text-lg font-medium">修改密码</h3>
                          <PasswordForm />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                              <p className="font-medium">双重认证 (2FA)</p>
                              <p className="text-sm text-muted-foreground">为您的账号添加一层额外的保护</p>
                          </div>
                          <Button variant="outline" disabled>暂未开放</Button>
                      </div>
                  </CardContent>
              </Card>
           </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
