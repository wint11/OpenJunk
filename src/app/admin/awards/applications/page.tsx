
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApplicationActions } from "./application-actions"
import Link from "next/link"

export default async function AwardApplicationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { managedAward: true }
  })

  // Determine which awards to show
  // If Super Admin, show all. If Award Admin, show only managed award.
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const managedAwardId = user?.managedAwardId

  if (!isSuperAdmin && !managedAwardId) {
    return <div>您无权访问此页面</div>
  }

  // Ensure managedAwardId is valid if not super admin
  if (!isSuperAdmin && !managedAwardId) {
     return <div>无权管理任何奖项</div>
  }

  const applications = await prisma.awardApplication.findMany({
    where: isSuperAdmin ? {} : { awardId: managedAwardId! },
    include: {
      award: { select: { name: true } },
      applicant: { select: { name: true, email: true } },
      nominationPapers: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">奖项申请管理</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全部申请 ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请奖项</TableHead>
                <TableHead>被提名人</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>关联代表作</TableHead>
                <TableHead>申请时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无申请记录
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.award.name}</TableCell>
                    <TableCell>{app.nomineeName}</TableCell>
                    <TableCell>
                      {app.applicant ? (
                        <div className="flex flex-col">
                          <span>{app.applicant.name}</span>
                          <span className="text-xs text-muted-foreground">{app.applicant.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">游客</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {app.nominationPapers.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {app.nominationPapers.map(paper => (
                            <Link 
                              key={paper.id} 
                              href={`/papers/${paper.id}`} 
                              className="text-xs text-primary hover:underline truncate max-w-[200px] block"
                              title={paper.title}
                            >
                              {paper.title}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">无关联论文</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(app.createdAt).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      {app.status === 'PENDING' && <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs">待审核</span>}
                      {app.status === 'APPROVED' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">已通过</span>}
                      {app.status === 'REJECTED' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs">已驳回</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                         <ApplicationActions id={app.id} status={app.status} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
