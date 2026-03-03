
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function ConferenceReviewPage() {
  const novels = await prisma.novel.findMany({
    where: {
      status: { in: ['DRAFT', 'PUBLISHED', 'PENDING'] },
      conferenceId: { not: null }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      uploader: { select: { name: true } },
      conference: { select: { name: true } }
    }
  })

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">会议评审</h1>
          <p className="text-muted-foreground mt-2">
            浏览并评审各类会议论文。
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {novels.map((paper) => (
          <Card key={paper.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start gap-2 mb-2">
                <Badge variant="secondary">
                  会议论文
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {paper.createdAt.toLocaleDateString()}
                </span>
              </div>
              <CardTitle className="line-clamp-2 leading-tight">
                <Link href={`/novel/${paper.id}`} className="hover:underline">
                  {paper.title}
                </Link>
              </CardTitle>
              <CardDescription className="line-clamp-1">
                {paper.author}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>会议:</span>
                  <span className="font-medium truncate max-w-[150px]" title={paper.conference?.name}>
                    {paper.conference?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>上传者:</span>
                  <span className="font-medium truncate max-w-[150px]">
                    {paper.uploader?.name || "匿名用户"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {novels.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            暂无会议评审数据
          </div>
        )}
      </div>
    </div>
  )
}
