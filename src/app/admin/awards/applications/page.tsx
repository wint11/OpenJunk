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

  // 获取管理的奖项及其奖项等级
  const awards = await prisma.award.findMany({
    where: isSuperAdmin ? {} : { id: managedAwardId! },
    include: {
      prizeLevels: {
        orderBy: { order: 'asc' }
      }
    }
  })

  const awardIds = awards.map(a => a.id)

  const applications = await prisma.awardApplication.findMany({
    where: { awardId: { in: awardIds } },
    include: {
      award: { 
        select: { 
          id: true,
          name: true,
          prizeLevels: {
            orderBy: { order: 'asc' }
          }
        } 
      },
      track: { select: { name: true } },
      cycle: { select: { name: true } },
      journal: { select: { name: true } },
      prizeLevel: { select: { name: true, color: true } },
      applicant: { select: { name: true, email: true } },
      nominationPapers: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  // 构建奖项等级映射
  const prizeLevelsMap = new Map()
  awards.forEach(award => {
    prizeLevelsMap.set(award.id, award.prizeLevels)
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
                <TableHead>周期/赛道</TableHead>
                <TableHead>被提名者</TableHead>
                <TableHead>关联期刊</TableHead>
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
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    暂无申请记录
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.award.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="text-muted-foreground">{app.cycle?.name || '-'}</span>
                        <span className="text-blue-600">{app.track?.name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{app.nomineeName}</span>
                        <span className="text-xs text-muted-foreground">
                          {app.nomineeType === 'TEAM' ? '团队' : '个人'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {app.journal ? (
                        <Link 
                          href={`/journal/${app.journalId}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {app.journal.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
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
                              href={`/novel/${paper.id}`} 
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
                      {app.status === 'PENDING' && (
                        <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs">待审核</span>
                      )}
                      {app.status === 'REVIEWING' && (
                        <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">评审中</span>
                      )}
                      {app.status === 'REJECTED' && (
                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs">不予授奖</span>
                      )}
                      {app.prizeLevel && (
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: `${app.prizeLevel.color}20`,
                            color: app.prizeLevel.color 
                          }}
                        >
                          {app.prizeLevel.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <ApplicationActions 
                          id={app.id} 
                          status={app.status}
                          nomineeName={app.nomineeName || ''}
                          prizeLevels={prizeLevelsMap.get(app.award.id) || []}
                          reviewComment={app.reviewComment}
                          isPublished={app.isPublished}
                        />
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
