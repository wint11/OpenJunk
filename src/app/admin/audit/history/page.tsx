import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function AuditHistoryPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""

  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(role)) {
    redirect("/")
  }

  // Get current user to check permissions
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { 
      managedJournal: true,
      reviewerJournals: true
    }
  })

  const whereClause: any = {}

  // Permission check logic for audit history
  if (role === 'SUPER_ADMIN') {
    // 总编 (SUPER_ADMIN):
    // 能够看到所有的期刊/会议/通用稿件的审核记录。
    // 之前排除了 conferenceId: null，导致会议记录不可见。现在移除该限制。
    whereClause.novel = {} // No filter on novel type
  } else if (role === 'ADMIN') {
    // 主编/会议主席 (ADMIN):
    // 1. 看到自己操作过的所有记录。
    // 2. 看到归属于自己所管理期刊 OR 会议的所有记录。
    
    const conditions: any[] = [
        { reviewerId: session?.user?.id } // 自己操作的
    ]

    if (currentUser?.managedJournalId) {
        conditions.push({ novel: { journalId: currentUser.managedJournalId } })
    }

    if (currentUser?.managedConferenceId) {
        conditions.push({ novel: { conferenceId: currentUser.managedConferenceId } })
    }

    whereClause.OR = conditions
  } else if (role === 'REVIEWER') {
    // 审稿人/编辑 (REVIEWER):
    // 只能看到自己操作过的记录。
    whereClause.reviewerId = session?.user?.id
  }

  const logs = await prisma.reviewLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      novel: { select: { title: true } },
      reviewer: { select: { name: true } }
    },
    take: 50
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">审核历史记录</h1>
      </div>
      
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">标题</TableHead>
              <TableHead className="w-[100px]">审核人</TableHead>
              <TableHead className="w-[80px]">动作</TableHead>
              <TableHead className="w-[300px]">反馈/备注</TableHead>
              <TableHead className="w-[150px]">时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  暂无审核记录
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    <div className="max-w-[300px] truncate" title={log.novel.title}>
                        {log.novel.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col max-w-[100px] truncate" title={log.reviewer?.name || '未知'}>
                        <span>{log.reviewer?.name || '未知'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.action === 'APPROVE' ? 'default' : 'destructive'}>
                      {log.action === 'APPROVE' ? '通过' : '拒绝'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate" title={log.feedback || ''}>
                        {log.feedback || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[150px] truncate" title={new Date(log.createdAt).toLocaleString()}>
                        {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
