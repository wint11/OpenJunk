
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function FundReviewPage() {
  // Assuming Fund Applications that are approved or under review can be publicly reviewed if configured?
  // For now, let's list approved funds or specific reviewable items.
  // The user requirement is vague on "Fund Review", assuming it means browsing funds or applications.
  // Let's list Fund Applications for now as "Fund Review".
  
  const applications = await prisma.fundApplication.findMany({
    where: {
      status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      fund: { select: { title: true } }
    }
  })

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">基金评审</h1>
          <p className="text-muted-foreground mt-2">
            浏览并评审各类基金申报项目。
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
                <Link href={`/fund/projects/${app.id}`} className="hover:underline">
                  {app.title}
                </Link>
              </CardTitle>
              <CardDescription className="line-clamp-1">
                申请人: {app.applicantName}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>基金:</span>
                  <span className="font-medium truncate max-w-[150px]" title={app.fund.title}>
                    {app.fund.title}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {applications.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            暂无基金评审数据
          </div>
        )}
      </div>
    </div>
  )
}
