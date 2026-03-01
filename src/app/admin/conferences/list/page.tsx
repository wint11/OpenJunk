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
import { ConferenceDialog } from "./conference-dialog"
import { DeleteConferenceButton } from "./delete-button"
import { Calendar, MapPin, Eye } from "lucide-react"
import Link from "next/link"

export default async function ConferenceListPage() {
  const session = await auth()
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"
  
  if (!isSuperAdmin) {
    redirect("/admin")
  }

  const conferences = await prisma.conference.findMany({
    include: {
      _count: {
        select: { papers: true, admins: true, reviewers: true }
      }
    },
    orderBy: { startDate: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">会议列表管理</h1>
          <p className="text-muted-foreground">创建和管理学术会议，设置会议时间与地点。</p>
        </div>
        <ConferenceDialog mode="create" />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>会议名称</TableHead>
              <TableHead>地点</TableHead>
              <TableHead>时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>论文数</TableHead>
              <TableHead>参与人员</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conferences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  暂无会议，请点击右上角创建。
                </TableCell>
              </TableRow>
            ) : (
              conferences.map((conf) => (
                <TableRow key={conf.id}>
                  <TableCell className="font-medium max-w-[200px] truncate" title={conf.name}>
                    {conf.name}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    <div className="flex items-center text-muted-foreground text-sm">
                        <MapPin className="mr-1 h-3 w-3" />
                        {conf.location || "线上"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm text-muted-foreground">
                        <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {conf.startDate.toLocaleDateString()}</span>
                        <span className="text-xs ml-4">至 {conf.endDate.toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={conf.status === "ACTIVE" ? "default" : "secondary"}>
                      {conf.status === "ACTIVE" ? "筹备/进行中" : conf.status === "COMPLETED" ? "已结束" : "已取消"}
                    </Badge>
                  </TableCell>
                  <TableCell>{conf._count.papers}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                        <span>管理员: {conf._count.admins}</span>
                        <span>审稿人: {conf._count.reviewers}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" asChild title="查看主页">
                       <Link href={`/conferences/${conf.id}`} target="_blank">
                         <Eye className="h-4 w-4" />
                       </Link>
                    </Button>
                    <ConferenceDialog mode="edit" conference={conf} />
                    <DeleteConferenceButton id={conf.id} disabled={conf._count.papers > 0 || conf._count.admins > 0 || conf._count.reviewers > 0} />
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
