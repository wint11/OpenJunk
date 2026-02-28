import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
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
import { Trash2 } from "lucide-react"
import { deleteFundDepartment } from "./actions"
import { CreateDepartmentDialog } from "./create-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function FundDepartmentsPage() {
  const session = await auth()
  
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
    redirect("/admin")
  }

  // Get user's managed categories
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { fundAdminCategories: true }
  })

  // Filter departments based on user role and managed categories
  let departmentWhere = {}
  let categoryWhere = {}
  
  if (session.user.role !== 'SUPER_ADMIN') {
    const categoryIds = user?.fundAdminCategories.map(c => c.id) || []
    
    // Check if user is a fund admin (has managed categories)
    if (categoryIds.length === 0) {
       // If ADMIN but no categories, they shouldn't be here or see nothing
       redirect("/admin")
    }
    
    departmentWhere = {
      categoryId: { in: categoryIds }
    }
    categoryWhere = {
      id: { in: categoryIds }
    }
  }

  // Get departments with their categories
  const departments = await prisma.fundDepartment.findMany({
    where: departmentWhere,
    include: {
      category: true
    },
    orderBy: [
        { categoryId: 'asc' },
        { code: 'asc' }
    ]
  })

  // Get categories for the create dialog
  const categories = await prisma.fundCategory.findMany({
    where: categoryWhere,
    select: { id: true, name: true }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">部门管理</h1>
          <p className="text-muted-foreground">创建和管理基金大类下的部门（如：数理科学部）。</p>
        </div>
        <CreateDepartmentDialog categories={categories} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>所有部门</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>所属基金</TableHead>
                <TableHead>部门名称</TableHead>
                <TableHead>部门代码</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    暂无部门，请点击右上角创建。
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                        <Badge variant="outline">{dept.category.name}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{dept.code}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                        {dept.description || '-'}
                    </TableCell>
                    <TableCell>{dept.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <form action={async () => {
                        'use server'
                        await deleteFundDepartment(dept.id)
                      }}>
                        <Button type="submit" variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
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
