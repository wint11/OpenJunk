import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Settings, Shield } from "lucide-react"
import { ReaderSettingsCard } from "@/app/profile/reader-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "./profile-form"
import { PasswordForm } from "./password-form"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Verify user exists in DB (handle stale sessions after DB reset)
  const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id }
  })
  if (!dbUser) {
      redirect("/api/auth/signout")
  }

  const role = session.user.role ?? ""
  
  const roleMap: Record<string, string> = {
    "USER": "普通读者",
    "AUTHOR": "投稿作者",
    "REVIEWER": "责任编辑",
    "ADMIN": "总编",
    "SUPER_ADMIN": "总编"
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
           <TabsTrigger value="settings" className="w-full justify-start px-3 py-2 h-auto data-[state=active]:bg-background">
              <Settings className="mr-2 h-4 w-4" />
              阅读设置
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
                  <CardDescription>查看和管理您的个人信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 overflow-y-auto">
                  <div className="flex items-center space-x-6">
                    <Avatar className="h-24 w-24 border-2 border-muted">
                      <AvatarImage src={session.user.image || ""} />
                      <AvatarFallback className="text-2xl">{session.user.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                         <h3 className="text-2xl font-semibold">{session.user.name}</h3>
                         <Badge variant="secondary">{roleMap[role] || role}</Badge>
                      </div>
                      <p className="text-muted-foreground">{session.user.email}</p>
                      <Button variant="outline" size="sm" className="mt-2" disabled>更换头像 (开发中)</Button>
                    </div>
                  </div>

                  <ProfileForm user={session.user} />
                </CardContent>
              </Card>
           </TabsContent>

           <TabsContent value="settings" className="mt-0 h-full">
              <div className="h-full">
                <ReaderSettingsCard />
              </div>
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
