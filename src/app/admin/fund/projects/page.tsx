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
import { CreateFundDialog } from "./create-dialog"
import { EditFundDialog } from "./edit-dialog"

export default async function FundProjectsPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect("/")
  }

  // Get user's managed categories
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { fundAdminCategories: true }
  })

  // Filter funds based on user role and managed categories
  let whereClause = {}
  if (session.user.role !== 'SUPER_ADMIN') {
    const categoryIds = user?.fundAdminCategories.map(c => c.id) || []
    whereClause = {
      categoryId: { in: categoryIds }
    }
  }

  const funds = await prisma.fund.findMany({
    where: whereClause,
    include: {
      category: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch categories for the create dialog
  // If not super admin, only show managed categories
  let categoryWhere = {}
  if (session.user.role !== 'SUPER_ADMIN') {
    const categoryIds = user?.fundAdminCategories.map(c => c.id) || []
    categoryWhere = {
      id: { in: categoryIds }
    }
  }

  const categories = await prisma.fundCategory.findMany({
    where: categoryWhere
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">基金项目管理</h1>
          <p className="text-muted-foreground">管理所有的基金项目（指南）</p>
        </div>
        <div>
           <CreateFundDialog categories={categories} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>项目列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目名称</TableHead>
                <TableHead>年度</TableHead>
                <TableHead>基金大类</TableHead>
                <TableHead>申报时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    暂无基金项目
                  </TableCell>
                </TableRow>
              ) : (
                funds.map((fund) => (
                  <TableRow key={fund.id}>
                    <TableCell className="font-medium">{fund.title}</TableCell>
                    <TableCell>{fund.year}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{fund.category.code}</Badge> {fund.category.name}
                    </TableCell>
                    <TableCell>
                      {format(fund.startDate, 'yyyy-MM-dd')} 至 {format(fund.endDate, 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={fund.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {fund.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(fund.createdAt, 'yyyy-MM-dd HH:mm')}</TableCell>
                    <TableCell>
                      <EditFundDialog fund={fund} />
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
