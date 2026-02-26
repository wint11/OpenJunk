import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserActions } from "./user-actions"
import { CreateUserDialog } from "./create-user-dialog"

export default async function UsersPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') redirect("/admin")

  // Get current user details for permission checks
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { id: true, role: true, managedJournalId: true }
  })

  let userQuery: any = {
    orderBy: { createdAt: 'desc' },
    include: { 
      managedJournal: true,
      reviewerJournals: true
    },
    where: {
      // Exclude Fund Admins from this list (they are managed in Fund Users)
      fundAdminCategories: {
        none: {}
      }
    }
  }

  // Restrict visibility for ADMIN (Journal Admin)
  if (role === 'ADMIN') {
    // Only show Reviewers or Authors/Users if needed.
    // Requirement: "Add and manage editor accounts" -> Focus on REVIEWER.
    // But maybe also see users?
    // Let's filter to:
    // 1. Users who are REVIEWER and assigned to this journal
    // 2. OR maybe allow finding users to promote them?
    // For now, let's show all REVIEWERs assigned to this journal.
    
    if (currentUser?.managedJournalId) {
        userQuery.where = {
            role: 'REVIEWER',
            reviewerJournals: {
                some: {
                    id: currentUser.managedJournalId
                }
            }
        }
    } else {
        // No journal managed, see no one
        userQuery.where = { id: 'NONE' }
    }
  }

  const users: any[] = await prisma.user.findMany(userQuery)

  let journals = await prisma.journal.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true }
  })

  // Filter journals for regular ADMIN
  if (role === 'ADMIN') {
    if (currentUser?.managedJournalId) {
      journals = journals.filter(j => j.id === currentUser.managedJournalId)
    } else {
      journals = []
    }
  }

  const roleMap: Record<string, string> = {
    "REVIEWER": "责任编辑",
    "ADMIN": "期刊管理员",
    "SUPER_ADMIN": "平台管理员",
    "USER": "普通读者",
    "AUTHOR": "投稿作者"
  }

  const statusMap: Record<string, string> = {
    "ACTIVE": "正常",
    "BANNED": "封禁",
    "PENDING": "待审核"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">论文用户管理</h1>
        <CreateUserDialog currentUserRole={role} journals={journals} />
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>账号</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>管理期刊</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              // Determine if current user can view this user's email
              let canViewEmail = false
              if (currentUser?.role === 'SUPER_ADMIN') {
                canViewEmail = true
              } else if (currentUser?.id === user.id) {
                canViewEmail = true
              } else if (currentUser?.role === 'ADMIN') {
                // Admin can see editors of their own journal
                if (user.role === 'REVIEWER' && currentUser.managedJournalId) {
                    const isAssigned = user.reviewerJournals.some((j: any) => j.id === currentUser.managedJournalId)
                    if (isAssigned) canViewEmail = true
                }
              }

              const displayEmail = canViewEmail ? user.email : "********"

              return (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell><Badge variant="outline">{roleMap[user.role] || user.role}</Badge></TableCell>
                <TableCell>
                  {user.role === 'ADMIN' ? (
                     user.managedJournal ? <Badge variant="secondary">{user.managedJournal.name}</Badge> : <span className="text-muted-foreground text-sm">未分配</span>
                  ) : user.role === 'REVIEWER' ? (
                     user.reviewerJournals.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {user.reviewerJournals.map((j: any) => (
                                <Badge key={j.id} variant="outline">{j.name}</Badge>
                            ))}
                        </div>
                     ) : <span className="text-muted-foreground text-sm">未分配</span>
                  ) : (
                     <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'BANNED' ? 'destructive' : 'default'}>
                    {statusMap[user.status] || user.status}
                  </Badge>
                </TableCell>
                <TableCell>{user.createdAt.toLocaleDateString('zh-CN')}</TableCell>
                <TableCell>
                  {currentUser?.role === 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN' ? (
                    <span className="text-muted-foreground text-xs">不可操作</span>
                  ) : (
                    <UserActions 
                      userId={user.id} 
                      name={user.name ?? ""}
                      email={user.email}
                      currentRole={user.role} 
                      currentStatus={user.status}
                      managedJournalId={user.managedJournalId}
                      reviewerJournals={user.reviewerJournals}
                      journals={journals}
                      currentUserRole={role}
                    />
                  )}
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
