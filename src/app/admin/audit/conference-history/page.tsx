import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function ConferenceAuditHistoryPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""

  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(role)) {
    redirect("/")
  }

  // Get current user to check permissions
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { 
      managedConference: true,
      reviewerConferences: true
    }
  })

  const whereClause: any = {
    novel: {
        conferenceId: { not: null }
    }
  }

  // Permission check
  if (role === 'ADMIN') {
    if (currentUser?.managedConferenceId) {
      // Admin can only see logs for papers in their managed conference
      whereClause.novel = {
        conferenceId: currentUser.managedConferenceId
      }
    } else {
      // Admin with no conference sees nothing
      whereClause.id = "NO_ACCESS"
    }
  } else if (role === 'REVIEWER') {
    // Reviewer can only see their own logs
    whereClause.reviewerId = session?.user?.id
  }
  // SUPER_ADMIN sees all

  const logs = await prisma.reviewLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      novel: { select: { title: true, conference: { select: { name: true } } } },
      reviewer: { select: { name: true } }
    },
    take: 50
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">会议审核历史记录</h1>
      </div>
      
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>论文</TableHead>
              <TableHead>所属会议</TableHead>
              <TableHead>审核人</TableHead>
              <TableHead>动作</TableHead>
              <TableHead>反馈/备注</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  暂无审核记录
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.novel.title}</TableCell>
                  <TableCell>
                    {log.novel.conference ? (
                       <Badge variant="outline">{log.novel.conference.name}</Badge>
                    ) : (
                       <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span>{log.reviewer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.action === 'APPROVE' ? 'default' : 'destructive'}>
                      {log.action === 'APPROVE' ? '通过' : '拒绝'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={log.feedback || ''}>
                    {log.feedback || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString()}
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
