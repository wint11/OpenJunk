import { prisma } from "@/lib/prisma"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProjectFilter } from "./project-filter"

export default async function PublicProjectListPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { categoryId, year, search } = await searchParams
  
  // Build where clause
  const where: any = { status: 'APPROVED' }
  
  if (categoryId && categoryId !== 'all') {
      where.fund = { categoryId }
  }
  
  if (year && year !== 'all') {
      where.fund = { ...where.fund, year: parseInt(year as string) }
  }
  
  if (search) {
     where.OR = [
        { title: { contains: search as string } },
        { applicantName: { contains: search as string } },
        { projectNo: { contains: search as string } }
     ]
  }

  // Fetch data
  const approvedApplications = await prisma.fundApplication.findMany({
    where,
    include: {
      fund: { include: { category: true } }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 100
  })

  // Fetch filter options
  const categories = await prisma.fundCategory.findMany({
      select: { id: true, name: true }
  })
  
  const yearsRaw = await prisma.fund.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' }
  })
  const years = yearsRaw.map(f => f.year)

  return (
    <div className="container mx-auto py-6 min-h-screen">
      <ProjectFilter categories={categories} years={years} />

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>所属基金</TableHead>
                <TableHead>所属项目</TableHead>
                <TableHead>立项编号</TableHead>
                <TableHead>项目名称</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>立项年度</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    暂无立项数据
                  </TableCell>
                </TableRow>
              ) : (
                approvedApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>{app.fund.category.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={app.fund.title}>{app.fund.title}</TableCell>
                    <TableCell className="font-mono text-sm">{app.projectNo || '-'}</TableCell>
                    <TableCell className="font-medium">
                        <Link href={`/fund/projects/${app.id}`} className="hover:underline">
                            {app.title}
                        </Link>
                    </TableCell>
                    <TableCell>{app.applicantName}</TableCell>
                    <TableCell>{app.fund.year}</TableCell>
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
