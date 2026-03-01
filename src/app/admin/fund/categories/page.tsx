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
import { CreateCategoryDialog } from "./create-category-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteCategoryButton } from "./delete-category-button"
import { EditFundDialog } from "./edit-fund-dialog"

export default async function FundCategoriesPage() {
  const session = await auth()
  
  // Only SUPER_ADMIN can manage fund categories
  // UPDATE: FUND_ADMIN should also be able to edit intro for their managed categories.
  // But "Fund List" page logic currently lists ALL categories for SUPER_ADMIN to manage (Create/Delete).
  
  // If we merge "Organization Intro" here, we need to:
  // 1. Allow FUND_ADMIN to access this page.
  // 2. Filter categories if FUND_ADMIN.
  // 3. Show "Create/Delete" only for SUPER_ADMIN.
  // 4. Show "Edit Intro" for everyone with access.

  const role = session?.user?.role
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') { // Assuming FUND_ADMIN is 'ADMIN' role in User table
    redirect("/admin")
  }

  // Check if FUND_ADMIN (User with fundAdminCategories)
  let managedCategoryIds: string[] = []
  let isSuperAdmin = role === 'SUPER_ADMIN'

  if (!isSuperAdmin) {
      const user = await prisma.user.findUnique({
          where: { id: session?.user?.id },
          include: { fundAdminCategories: true }
      })
      if (user?.fundAdminCategories.length) {
          managedCategoryIds = user.fundAdminCategories.map(c => c.id)
      } else {
          // Admin but not fund admin
          redirect("/admin")
      }
  }

  const whereClause = isSuperAdmin ? {} : { id: { in: managedCategoryIds } }

  const categories = await prisma.fundCategory.findMany({
    where: whereClause,
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
          <h1 className="text-3xl font-bold tracking-tight">基金列表与介绍</h1>
          <p className="text-muted-foreground">管理基金大类及其组织介绍信息。</p>
        </div>
        {isSuperAdmin && <CreateCategoryDialog />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基金组织列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>代码</TableHead>
                <TableHead>管理员</TableHead>
                <TableHead>介绍预览</TableHead>
                <TableHead>项目数</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    暂无基金大类。
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
                    <TableCell>
                      <div className="max-w-[200px] truncate text-muted-foreground text-sm">
                        {category.introContent || "暂无介绍"}
                      </div>
                    </TableCell>
                    <TableCell>{category._count.funds}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <EditFundDialog category={category} isSuperAdmin={isSuperAdmin} />
                        {isSuperAdmin && (
                            <DeleteCategoryButton id={category.id} />
                        )}
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
