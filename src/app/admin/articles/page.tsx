import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArticleActions } from "./article-actions"

export default async function ArticlesReviewPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""

  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    redirect("/")
  }

  const articles = await prisma.novel.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { uploader: true }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">文章审核</h1>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>上传者</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>AI 预审</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell>{article.author}</TableCell>
                <TableCell>{article.uploader?.name || "未知"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{article.type}</Badge>
                </TableCell>
                <TableCell>
                   <Badge variant={article.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                     {article.status}
                   </Badge>
                </TableCell>
                <TableCell>
                  {article.aiReviewedAt ? (
                    <div className="flex items-center gap-2">
                      <Badge variant={article.aiReviewPassed ? "default" : "destructive"}>
                        {article.aiReviewPassed ? "通过" : "不通过"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{article.aiQuality ?? 0}/10</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">未预审</span>
                  )}
                </TableCell>
                <TableCell>
                  <ArticleActions 
                    id={article.id} 
                    status={article.status} 
                    pendingCoverUrl={article.pendingCoverUrl}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
