import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { FilterForm } from "./filter-form"
import { SerialEditor } from "./serial-editor"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function FundApprovalsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth()
  if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect("/admin")
  }

  const { departmentId, status, year, categoryId, search } = await searchParams

  // Check permissions
  let managedCategoryIds: string[] = []
  if (session.user.role !== 'SUPER_ADMIN') {
      const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { fundAdminCategories: true }
      })
      if (!user?.fundAdminCategories || user.fundAdminCategories.length === 0) {
          redirect("/admin")
      }
      managedCategoryIds = user.fundAdminCategories.map(c => c.id)
  }

  // Build filter
  const where: any = {}

  if (managedCategoryIds.length > 0) {
      where.fund = { categoryId: { in: managedCategoryIds } }
  }

  if (departmentId && departmentId !== 'all') {
      where.departmentId = departmentId
  }

  if (categoryId && categoryId !== 'all') {
      // If user is restricted, ensure they can only filter within their managed categories
      if (managedCategoryIds.length > 0 && !managedCategoryIds.includes(categoryId as string)) {
          // Invalid filter, ignore or redirect? Let's ignore and rely on `fund.categoryId` restriction above
      } else {
          where.fund = { ...where.fund, categoryId: categoryId }
      }
  }

  if (status) {
      where.status = status
  } else {
      where.status = 'APPROVED'
  }

  if (year && year !== 'all') {
      where.fund = { ...where.fund, year: parseInt(year as string) }
  }

  if (search) {
      where.OR = [
          { title: { contains: search as string } },
          { applicantName: { contains: search as string } },
          { serialNo: { contains: search as string } }
      ]
  }

  // Fetch data
  const applications = await prisma.fundApplication.findMany({
      where,
      include: {
          fund: { include: { category: true } },
          department: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit for performance
  })

  // Fetch options for filter
  const categories = await prisma.fundCategory.findMany({
      where: managedCategoryIds.length > 0 ? { id: { in: managedCategoryIds } } : {}
  })

  const departments = await prisma.fundDepartment.findMany({
      where: managedCategoryIds.length > 0 ? { categoryId: { in: managedCategoryIds } } : {},
      orderBy: { code: 'asc' }
  })

  const yearsRaw = await prisma.fund.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' }
  })
  const years = yearsRaw.map(f => f.year)

  return (
      <div className="space-y-6">
          <div className="flex items-center justify-between">
              <div>
                  <h1 className="text-3xl font-bold tracking-tight">立项管理</h1>
                  <p className="text-muted-foreground">管理基金项目立项编号及状态。</p>
              </div>
          </div>

          <FilterForm 
              categories={categories} 
              departments={departments} 
              years={years} 
          />

          <div className="rounded-md border bg-card">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>立项编号</TableHead>
                          <TableHead>申请编号</TableHead>
                          <TableHead>项目名称</TableHead>
                          <TableHead>申请人</TableHead>
                          <TableHead>所属基金</TableHead>
                          <TableHead>部门</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>申请时间</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {applications.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                  暂无数据
                              </TableCell>
                          </TableRow>
                      ) : (
                          applications.map((app) => (
                              <TableRow key={app.id}>
                                  <TableCell>
                                      <SerialEditor id={app.id} initialSerialNo={app.projectNo || '-'} />
                                  </TableCell>
                                  <TableCell>
                                      <span className="font-mono text-xs">{app.serialNo}</span>
                                  </TableCell>
                                  <TableCell className="font-medium max-w-xs truncate" title={app.title}>{app.title}</TableCell>
                                  <TableCell>{app.applicantName}</TableCell>
                                  <TableCell>
                                      <div className="flex flex-col">
                                        <span className="text-xs font-medium">{app.fund.category.name}</span>
                                        <span className="text-xs text-muted-foreground">{app.fund.year}年度</span>
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      {app.department ? (
                                          <Badge variant="secondary" className="text-xs">{app.department.name}</Badge>
                                      ) : (
                                          <span className="text-muted-foreground text-xs">-</span>
                                      )}
                                  </TableCell>
                                  <TableCell>
                                      <Badge className={
                                          app.status === 'APPROVED' ? 'bg-green-500' :
                                          app.status === 'COMPLETED' ? 'bg-blue-500' :
                                          'bg-gray-500'
                                      }>
                                          {app.status === 'APPROVED' ? '已立项' :
                                           app.status === 'COMPLETED' ? '已结项' : app.status}
                                      </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">{app.createdAt.toLocaleDateString()}</TableCell>
                              </TableRow>
                          ))
                      )}
                  </TableBody>
              </Table>
          </div>
      </div>
  )
}
