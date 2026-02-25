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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { JournalDialog } from "./journal-dialog"
import { DeleteJournalButton } from "./delete-button"

export default async function JournalsPage() {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  const journals = await prisma.journal.findMany({
    include: {
      _count: {
        select: { papers: true, admins: true, reviewers: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">期刊管理</h1>
        <JournalDialog mode="create" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>论文数</TableHead>
              <TableHead>管理员/编辑</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {journals.map((journal) => (
              <TableRow key={journal.id}>
                <TableCell className="font-medium">{journal.name}</TableCell>
                <TableCell className="max-w-xs truncate">{journal.description}</TableCell>
                <TableCell>
                  <Badge variant={journal.status === "ACTIVE" ? "default" : "secondary"}>
                    {journal.status === "ACTIVE" ? "活跃" : "归档"}
                  </Badge>
                </TableCell>
                <TableCell>{journal._count.papers}</TableCell>
                <TableCell>{journal._count.admins} / {journal._count.reviewers}</TableCell>
                <TableCell>{journal.createdAt.toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <JournalDialog mode="edit" journal={journal} />
                  <DeleteJournalButton id={journal.id} disabled={journal._count.papers > 0 || journal._count.admins > 0 || journal._count.reviewers > 0} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
