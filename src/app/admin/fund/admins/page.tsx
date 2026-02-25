import { prisma } from "@/lib/prisma"
import { CreateAdminDialog } from "./create-admin-dialog"
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
import { deleteFundAdmin } from "./actions"

export default async function FundAdminsPage() {
  // 获取所有的基金大类，用于创建弹窗
  const categories = await prisma.fundCategory.findMany()

  // 获取现有的基金管理员
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      fundAdminCategories: {
        some: {} // 至少管理一个分类
      }
    },
    include: {
      fundAdminCategories: true
    }
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">基金管理员设置</h1>
          <p className="text-muted-foreground">管理负责不同基金大类的管理员账号。</p>
        </div>
        <CreateAdminDialog categories={categories} />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>负责大类</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  暂无基金管理员
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {admin.fundAdminCategories.map((cat) => (
                        <Badge key={cat.id} variant="secondary">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{admin.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <form action={async () => {
                      'use server'
                      await deleteFundAdmin(admin.id)
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
      </div>
    </div>
  )
}
