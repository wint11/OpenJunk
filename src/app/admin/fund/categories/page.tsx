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
import { deleteFundCategory } from "./actions"
import { CreateCategoryDialog } from "./create-category-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function FundCategoriesPage() {
  const session = await auth()
  
  // Only SUPER_ADMIN can manage fund categories
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect("/admin")
  }

  const categories = await prisma.fundCategory.findMany({
    include: {
      admins: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: { funds: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">基金列表管理</h1>
          <p className="text-muted-foreground">创建和管理基金大类（如：国家自然科学基金），并分配管理员。</p>
        </div>
        <CreateCategoryDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>所有基金</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>代码</TableHead>
                <TableHead>管理员</TableHead>
                <TableHead>项目数</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    暂无基金大类，请点击右上角创建。
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
                      <div className="flex flex-wrap gap-1">
                        {category.admins.length === 0 ? (
                          <span className="text-muted-foreground text-sm">暂无管理员</span>
                        ) : (
                          category.admins.map((admin) => (
                            <Badge key={admin.id} variant="secondary">
                              {admin.name || admin.email}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{category._count.funds}</TableCell>
                    <TableCell>{category.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <form action={async () => {
                        'use server'
                        await deleteFundCategory(category.id)
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
