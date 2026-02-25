import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye } from "lucide-react"

export default async function FundApplicationsPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect("/")
  }

  // In a real scenario, we should filter by the fund categories the admin manages.
  // For now, we show all for simplicity as requested to "implement the page".
  
  const applications = await prisma.fundApplication.findMany({
    include: {
      fund: true,
      reviews: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">已立项</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">未立项</Badge>
      case 'SUBMITTED':
        return <Badge variant="secondary">已提交</Badge>
      case 'UNDER_REVIEW':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">评审中</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">基金申报管理</h1>
          <p className="text-muted-foreground">查看和管理所有的基金申报书</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>申报列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>受理编号</TableHead>
                <TableHead>项目名称</TableHead>
                <TableHead>所属基金</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>提交时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    暂无申报数据
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono">{app.serialNo || '-'}</TableCell>
                    <TableCell className="font-medium">{app.title}</TableCell>
                    <TableCell>{app.fund.title}</TableCell>
                    <TableCell>{app.applicantName}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>{format(app.createdAt, 'yyyy-MM-dd HH:mm')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/fund/applications/${app.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> 查看/审查
                        </Link>
                      </Button>
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
