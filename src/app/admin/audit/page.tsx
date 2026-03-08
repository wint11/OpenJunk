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
              <TableHead className="w-[150px]">时间</TableHead>
              <TableHead className="w-[150px]">用户</TableHead>
              <TableHead className="w-[120px]">动作</TableHead>
              <TableHead className="w-[120px]">资源</TableHead>
              <TableHead className="w-[300px]">详情</TableHead>
              <TableHead className="w-[120px]">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: AuditLogWithUser) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="max-w-[150px] truncate">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px] truncate" title={log.user?.name || log.user?.email || 'System'}>
                    {log.user?.name || log.user?.email || 'System'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.action.includes('DELETE') ? 'destructive' :
                      log.action.includes('APPROVE') ? 'default' :
                      'secondary'
                    }
                    className="max-w-[120px] truncate"
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[120px] truncate" title={log.resource}>
                    {log.resource}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[300px] truncate" title={log.details || ''}>
                    {log.details}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[120px] truncate" title={log.ipAddress || ''}>
                    {log.ipAddress}
                  </div>
                </TableCell>
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
