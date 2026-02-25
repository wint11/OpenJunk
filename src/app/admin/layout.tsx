import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, Users, History, BookOpen, Layers, Mail, ClipboardList, Wallet } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || !session.user?.id) redirect("/login")
  
  const role = session.user?.role ?? ""
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(role)) {
    redirect("/")
  }

  // Check if user is a Fund Admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { fundAdminCategories: true }
  })
  
  const isFundAdmin = user?.fundAdminCategories && user.fundAdminCategories.length > 0
  const isJournalAdmin = role === 'ADMIN' && !isFundAdmin // Assuming non-fund admins are journal admins if role is ADMIN

  // Fetch unread notifications count
  const unreadCount = await prisma.notification.count({
    where: {
      userId: session.user.id,
      status: 'UNREAD'
    }
  })

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 hidden md:block flex-shrink-0 h-screen sticky top-0 overflow-y-auto">
        <div className="flex h-16 items-center border-b px-6 bg-background/50 backdrop-blur">
          <Link href="/admin" className="font-bold text-lg">
            {role === 'SUPER_ADMIN' ? '系统后台' : (isFundAdmin ? '基金管理后台' : '期刊管理后台')}
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4"/> 概览</Link>
          </Button>

          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link href="/admin/messages" className="flex items-center justify-between">
               <div className="flex items-center">
                 <Mail className="mr-2 h-4 w-4"/> 消息中心
               </div>
               {unreadCount > 0 && (
                 <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center flex items-center justify-center h-5">
                   {unreadCount > 99 ? '99+' : unreadCount}
                 </span>
               )}
            </Link>
          </Button>
          
          {/* SUPER ADMIN MENUS */}
          {role === "SUPER_ADMIN" && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase mt-2">平台管理</div>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/journals"><Layers className="mr-2 h-4 w-4"/> 期刊列表</Link>
              </Button>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/users"><Users className="mr-2 h-4 w-4"/> 用户管理</Link>
              </Button>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/audit"><History className="mr-2 h-4 w-4"/> 审计日志</Link>
              </Button>

              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase mt-2">基金管理</div>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/fund/admins"><Users className="mr-2 h-4 w-4"/> 管理员设置</Link>
              </Button>
            </>
          )}

          {/* JOURNAL ADMIN MENUS */}
          {isJournalAdmin && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase mt-2">期刊管理</div>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/journals"><Layers className="mr-2 h-4 w-4"/> 期刊设置</Link>
              </Button>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/users"><Users className="mr-2 h-4 w-4"/> 编辑管理</Link>
              </Button>
            </>
          )}

          {/* FUND ADMIN MENUS */}
          {(isFundAdmin || role === 'SUPER_ADMIN') && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase mt-2">基金业务</div>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/fund/projects"><Wallet className="mr-2 h-4 w-4"/> 项目管理</Link>
              </Button>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/fund/applications"><ClipboardList className="mr-2 h-4 w-4"/> 申报管理</Link>
              </Button>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/fund/reviews"><FileText className="mr-2 h-4 w-4"/> 评审管理</Link>
              </Button>
            </>
          )}

          {/* JOURNAL ADMIN / REVIEWER MENUS (Hide for Fund Admin unless they have dual roles, but assuming separation for now) */}
          {(!isFundAdmin || role === 'SUPER_ADMIN') && ["ADMIN", "SUPER_ADMIN", "REVIEWER"].includes(role) && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase mt-2">审稿管理</div>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/audit/novels"><FileText className="mr-2 h-4 w-4"/> 新稿件审阅</Link>
              </Button>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/audit/chapters"><FileText className="mr-2 h-4 w-4"/> 修订稿审阅</Link>
              </Button>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/audit/history"><History className="mr-2 h-4 w-4"/> 审稿记录</Link>
              </Button>
            </>
          )}

          {/* CONTENT MANAGEMENT (Only for Journal Admin/Super Admin) */}
          {(!isFundAdmin || role === 'SUPER_ADMIN') && ["ADMIN", "SUPER_ADMIN"].includes(role) && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">内容管理</div>
              <Button variant="ghost" className="justify-start w-full pl-6" asChild>
                <Link href="/admin/novels"><BookOpen className="mr-2 h-4 w-4"/> 已录用稿件</Link>
              </Button>
            </>
          )}
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 bg-background overflow-x-hidden">
        <div className="h-full p-8">
           {children}
        </div>
      </main>
    </div>
  )
}
