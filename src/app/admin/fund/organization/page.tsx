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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditIntroDialog } from "./edit-intro-dialog"

export default async function OrganizationPage() {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect("/admin")
  }

  // Determine user permissions
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  
  // Filter categories based on user role
  let whereClause = {}
  if (!isSuperAdmin) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { fundAdminCategories: true }
    })
    const managedIds = user?.fundAdminCategories.map(c => c.id) || []
    whereClause = {
      id: { in: managedIds }
    }
  }

  const categories = await prisma.fundCategory.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">组织介绍管理</h1>
          <p className="text-muted-foreground">管理基金大类的详细介绍和展示图片。</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>管理的组织</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>代码</TableHead>
                <TableHead>当前介绍</TableHead>
                <TableHead>当前图片</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    暂无管理的组织。
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{category.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate text-muted-foreground">
                        {category.introContent || "暂无介绍"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.introImages ? (
                        <div className="relative w-16 h-10 rounded overflow-hidden bg-muted">
                           <img src={category.introImages} alt="Cover" className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">暂无图片</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <EditIntroDialog category={category} />
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
