
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
import { ExternalLink, Settings } from "lucide-react"
import Link from "next/link"

export default async function AdminAwardsPage() {
  const session = await auth()
  
  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  const awards = await prisma.award.findMany({
    include: {
      _count: {
        select: { applications: true, admins: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">奖项管理</h1>
        <Button asChild>
          <Link href="/awards/new" target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" /> 创办新奖项
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>申请数</TableHead>
              <TableHead>管理员数</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {awards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  暂无奖项
                </TableCell>
              </TableRow>
            ) : (
              awards.map((award) => (
                <TableRow key={award.id}>
                  <TableCell className="font-medium">{award.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{award.description}</TableCell>
                  <TableCell>
                    <Badge variant={award.status === "ACTIVE" ? "default" : "secondary"}>
                      {award.status === "ACTIVE" ? "活跃" : "归档"}
                    </Badge>
                  </TableCell>
                  <TableCell>{award._count.applications}</TableCell>
                  <TableCell>{award._count.admins}</TableCell>
                  <TableCell>{award.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/awards/${award.id}`} title="编辑奖项">
                            <Settings className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/awards/${award.id}`} target="_blank" title="查看前台页面">
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    </Button>
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
