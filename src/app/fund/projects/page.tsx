import { prisma } from "@/lib/prisma"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function PublicProjectListPage() {
  const approvedApplications = await prisma.fundApplication.findMany({
    where: {
      status: 'APPROVED'
    },
    include: {
      fund: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return (
    <div className="container mx-auto py-10 min-h-screen">
      <div className="mb-8 text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          已立项项目列表
        </h1>
        <p className="text-muted-foreground text-lg">
          公示所有获得资助的基金项目
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>立项名单</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目名称</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>所属基金</TableHead>
                <TableHead>立项年度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    暂无立项数据
                  </TableCell>
                </TableRow>
              ) : (
                approvedApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                        <Link href={`/fund/projects/${app.id}`} className="hover:underline">
                            {app.title}
                        </Link>
                    </TableCell>
                    <TableCell>{app.applicantName}</TableCell>
                    <TableCell>{app.fund.title}</TableCell>
                    <TableCell>{app.fund.year}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-600">已立项</Badge>
                    </TableCell>
                    <TableCell>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/fund/projects/${app.id}`}>查看详情</Link>
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
