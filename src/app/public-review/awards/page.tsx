
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function AwardReviewPage() {
  const applications = await prisma.awardApplication.findMany({
    where: {
      status: { in: ['PENDING', 'APPROVED'] }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      award: { select: { name: true } },
      applicant: { select: { name: true } }
    }
  })

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">奖项评审</h1>
          <p className="text-muted-foreground mt-2">
            浏览并评审各类奖项申请。
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {applications.map((app) => (
          <Card key={app.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start gap-2 mb-2">
                <Badge variant="outline">
                  {app.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {app.createdAt.toLocaleDateString()}
                </span>
              </div>
              <CardTitle className="line-clamp-2 leading-tight">
                {app.award.name} - 申请
              </CardTitle>
              <CardDescription className="line-clamp-1">
                被提名人: {app.nomineeName}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>奖项:</span>
                  <span className="font-medium truncate max-w-[150px]" title={app.award.name}>
                    {app.award.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>申请人:</span>
                  <span className="font-medium truncate max-w-[150px]">
                    {app.applicant?.name || "匿名"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {applications.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            暂无奖项评审数据
          </div>
        )}
      </div>
    </div>
  )
}
