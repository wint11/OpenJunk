import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ArticleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = session?.user?.role ?? ""

  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    redirect("/")
  }

  const { id } = await params
  const novel = await prisma.novel.findUnique({
    where: { id },
    include: { 
      uploader: true,
      chapters: {
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!novel) {
    notFound()
  }

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center gap-4 flex-none">
        <Link href="/admin/articles">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">文章详情审核</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 flex-1 overflow-hidden">
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="flex-none">
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">标题</span>
                <p className="text-lg font-semibold">{novel.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">作者</span>
                <p>{novel.author}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">上传者</span>
                <p>{novel.uploader?.name || "未知"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">类型</span>
                <p><Badge variant="outline">{novel.type}</Badge></p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">状态</span>
                <p><Badge>{novel.status}</Badge></p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">分类</span>
                <p>{novel.category}</p>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">简介</span>
              <p className="mt-1 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {novel.description}
              </p>
            </div>
            {novel.coverUrl && (
                <div>
                    <span className="text-sm font-medium text-muted-foreground">封面</span>
                    <div className="mt-2">
                        <img src={novel.coverUrl} alt="Cover" className="h-48 object-cover rounded-md" />
                    </div>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="flex-none">
            <CardTitle>章节内容 ({novel.chapters.length})</CardTitle>
            <CardDescription>所有章节正文</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
             <ScrollArea className="h-full">
                <div className="divide-y">
                    {novel.chapters.map((chapter) => (
                        <div key={chapter.id} className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">#{chapter.order} {chapter.title}</h3>
                                <Badge variant="outline">
                                    {chapter.content.length} 字
                                </Badge>
                            </div>
                            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap font-serif leading-relaxed">
                                {chapter.content}
                            </div>
                        </div>
                    ))}
                    {novel.chapters.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            暂无章节内容
                        </div>
                    )}
                </div>
             </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}