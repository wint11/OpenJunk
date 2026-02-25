import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Prisma } from "@prisma/client"

type AuditLogWithUser = Prisma.AuditLogGetPayload<{
  include: { user: true }
}>

export default async function AuditPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""
  if (role !== "SUPER_ADMIN") redirect("/admin")

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true },
    take: 50
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">审计日志</h1>
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>时间</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>动作</TableHead>
              <TableHead>资源</TableHead>
              <TableHead>详情</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: AuditLogWithUser) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  {log.user?.name || log.user?.email || 'System'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.action.includes('DELETE') ? 'destructive' :
                      log.action.includes('APPROVE') ? 'default' :
                      'secondary'
                    }
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>{log.resource}</TableCell>
                <TableCell>{log.details}</TableCell>
                <TableCell>{log.ipAddress}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">暂无审计日志</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
