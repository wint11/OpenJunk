import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { adminMenuConfig, AdminRole } from "@/config/admin-menu"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || !session.user?.id) redirect("/login")
  
  const role = session.user?.role ?? ""
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(role)) {
    redirect("/")
  }

  // Check user roles
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { 
        fundAdminCategories: true,
        managedConference: true // Check for conference admin
    }
  })
  
  const isFundAdmin = user?.fundAdminCategories && user.fundAdminCategories.length > 0
  const isAwardAdmin = user?.managedAwardId !== null
  const isConferenceAdmin = user?.managedConferenceId !== null
  // If user manages a conference, they are Conference Admin.
  // If user manages a journal, they are Journal Admin.
  // A user could be both, or neither (generic admin).
  const isJournalAdmin = role === 'ADMIN' && user?.managedJournalId !== null

  // Determine current user's effective roles
  const userRoles: AdminRole[] = []
  if (role === 'SUPER_ADMIN') userRoles.push('SUPER_ADMIN')
  if (isFundAdmin) userRoles.push('FUND_ADMIN')
  if (isAwardAdmin) userRoles.push('AWARD_ADMIN')
  if (isJournalAdmin) userRoles.push('JOURNAL_ADMIN')
  if (isConferenceAdmin) userRoles.push('CONFERENCE_ADMIN')
  if (role === 'REVIEWER') userRoles.push('REVIEWER')

  // Determine dashboard title
  let dashboardTitle = '期刊管理后台'
  if (role === 'SUPER_ADMIN') dashboardTitle = '系统后台'
  else if (isFundAdmin) dashboardTitle = '基金管理后台'
  else if (isAwardAdmin) dashboardTitle = '奖项管理后台'
  else if (isConferenceAdmin) dashboardTitle = '会议管理后台'

  // Fetch unread notifications count
  const unreadCount = await prisma.notification.count({
    where: {
      userId: session.user.id,
      status: 'UNREAD'
    }
  })

  // Helper to check if user has access to a menu item
  const hasAccess = (requiredRoles: AdminRole[]) => {
    return requiredRoles.some(role => userRoles.includes(role))
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 hidden md:flex flex-col flex-shrink-0 h-full">
        <div className="flex-none h-16 flex items-center border-b px-6 bg-background/50 backdrop-blur">
          <Link href="/admin" className="font-bold text-lg">
            {dashboardTitle}
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto flex flex-col gap-1 p-4">
          {adminMenuConfig.map((group, index) => {
            // Filter items user has access to
            const visibleItems = group.items.filter(item => hasAccess(item.roles))
            
            if (visibleItems.length === 0) return null

            return (
              <div key={index} className="mb-2">
                {group.title && (
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase mt-2">
                    {group.title}
                  </div>
                )}
                {visibleItems.map((item) => (
                  <Button key={item.href} variant="ghost" className="justify-start w-full pl-6" asChild>
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-4 w-4"/>
                      <span>{item.title}</span>
                      {item.href === '/admin/messages' && unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center flex items-center justify-center h-5">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                ))}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
