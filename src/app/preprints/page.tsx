
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function PreprintsPage() {
  // Fetch all preprints from the dedicated Preprint table
  const preprints = await prisma.preprint.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      uploader: { select: { name: true } }
    }
  })

  // Fetch all novels (Journals/Conferences) with status DRAFT or PUBLISHED
  const novels = await prisma.novel.findMany({
    where: {
      status: { in: ['DRAFT', 'PUBLISHED', 'PENDING'] }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      uploader: { select: { name: true } },
      journal: { select: { name: true } },
      conference: { select: { name: true } }
    }
  })

  // Combine and sort
  const allPapers = [
    ...preprints.map(p => ({
      id: p.id,
      title: p.title,
      authors: p.authors,
      createdAt: p.createdAt,
      uploaderName: p.uploader?.name,
      source: '预印本',
      type: 'PREPRINT'
    })),
    ...novels.map(n => ({
      id: n.id,
      title: n.title,
      authors: n.author,
      createdAt: n.createdAt,
      uploaderName: n.uploader?.name,
      source: n.journal?.name || n.conference?.name || '其他来源',
      type: 'NOVEL'
    }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">预印本</h1>
          <p className="text-muted-foreground mt-2">
            发现最新的研究成果，包括所有已投稿和已发布的论文。
          </p>
        </div>
        <Button asChild>
          <Link href="/preprints/submit">
            <Plus className="mr-2 h-4 w-4" /> 发布预印本
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allPapers.map((paper) => (
          <Card key={paper.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start gap-2 mb-2">
                <Badge variant="secondary">
                  预印本
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {paper.createdAt.toLocaleDateString()}
                </span>
              </div>
              <CardTitle className="line-clamp-2 leading-tight">
                <Link href={`/preprints/${paper.id}`} className="hover:underline">
                  {paper.title}
                </Link>
              </CardTitle>
              <CardDescription className="line-clamp-1">
                {paper.authors}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>来源:</span>
                  <span className="font-medium truncate max-w-[150px]" title={paper.source}>
                    {paper.source}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>上传者:</span>
                  <span className="font-medium truncate max-w-[150px]">
                    {paper.uploaderName || "匿名用户"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {allPapers.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            暂无预印本数据
          </div>
        )}
      </div>
    </div>
  )
}
