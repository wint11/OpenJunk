import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserActions } from "./user-actions"
import { CreateUserDialog } from "./create-user-dialog"
import Link from "next/link"
import { ArrowUpDown, ArrowUp, ArrowDown, SortAsc } from "lucide-react"

interface UsersPageProps {
  searchParams: Promise<{
    sort?: string
    order?: string
  }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { sort, order } = await searchParams
  const session = await auth()
  const role = session?.user?.role ?? ""
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') redirect("/admin")

  // Get current user details for permission checks
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { id: true, role: true, managedJournalId: true }
  })

  // Build orderBy based on sort parameter
  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'name') {
    orderBy = { name: order === 'asc' ? 'asc' : 'desc' }
  } else if (sort === 'createdAt') {
    orderBy = { createdAt: order === 'asc' ? 'asc' : 'desc' }
  }

  let userQuery: any = {
    orderBy,
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

  // Helper to build sort link
  const getSortLink = (field: string) => {
    const currentSort = sort || 'createdAt'
    const currentOrder = order || 'desc'
    const newOrder = currentSort === field && currentOrder === 'desc' ? 'asc' : 'desc'
    return `/admin/users?sort=${field}&order=${newOrder}`
  }

  // Get sort icon
  const getSortIcon = (field: string) => {
    const currentSort = sort || 'createdAt'
    const currentOrder = order || 'desc'
    if (currentSort !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />
    }
    return currentOrder === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1 text-primary" />
      : <ArrowDown className="h-4 w-4 ml-1 text-primary" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">论文用户管理</h1>
          <p className="text-muted-foreground">管理系统用户账号</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sort Controls */}
          <div className="flex items-center border rounded-md p-1 bg-muted/20">
            <Link
              href={getSortLink('createdAt')}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all flex items-center ${!sort || sort === 'createdAt' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <SortAsc className="h-4 w-4 mr-1" />
              注册时间
              {getSortIcon('createdAt')}
            </Link>
            <Link
              href={getSortLink('name')}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all flex items-center ${sort === 'name' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              姓名拼音
              {getSortIcon('name')}
            </Link>
          </div>
          <CreateUserDialog currentUserRole={role} journals={journals} />
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">姓名</TableHead>
              <TableHead className="w-[200px]">账号</TableHead>
              <TableHead className="w-[100px]">角色</TableHead>
              <TableHead className="w-[200px]">管理期刊</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[120px]">注册时间</TableHead>
              <TableHead className="w-[150px]">操作</TableHead>
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
                <TableCell>
                  <div className="max-w-[120px] truncate" title={user.name || ''}>
                    {user.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={user.email}>
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="max-w-[100px] truncate">
                    {roleMap[user.role] || user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.role === 'ADMIN' ? (
                     user.managedJournal ? (
                       <Badge variant="secondary" className="max-w-[200px] truncate" title={user.managedJournal.name}>
                         {user.managedJournal.name}
                       </Badge>
                     ) : <span className="text-muted-foreground text-sm">未分配</span>
                  ) : user.role === 'REVIEWER' ? (
                     user.reviewerJournals.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {user.reviewerJournals.map((j: any) => (
                                <Badge key={j.id} variant="outline" className="text-xs truncate max-w-[190px]">{j.name}</Badge>
                            ))}
                        </div>
                     ) : <span className="text-muted-foreground text-sm">未分配</span>
                  ) : (
                     <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'BANNED' ? 'destructive' : 'default'} className="max-w-[80px] truncate">
                    {statusMap[user.status] || user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[120px] truncate">
                    {user.createdAt.toLocaleDateString('zh-CN')}
                  </div>
                </TableCell>
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
