
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Check, X, ArrowRight } from "lucide-react"
import { reviewPreprintUpdate } from "./actions"

export default async function PreprintAuditsPage() {
  const pendingUpdates = await prisma.preprint.findMany({
    where: {
      updateStatus: "PENDING"
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      uploader: { select: { name: true, email: true } }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">预印本更新审核</h2>
      </div>
      
      <div className="grid gap-6">
        {pendingUpdates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
            暂无待审核的更新申请
          </div>
        ) : (
          pendingUpdates.map((preprint) => (
            <Card key={preprint.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      <Link href={`/preprints/${preprint.id}`} className="hover:underline flex items-center gap-2">
                        {preprint.title}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-primary">{preprint.pendingTitle || preprint.title}</span>
                      </Link>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      提交人: {preprint.uploader?.name || "匿名用户"} ({preprint.uploader?.email || "无邮箱"}) • 
                      提交时间: {preprint.updatedAt.toLocaleString('zh-CN')}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    待审核
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
                {/* Changes Comparison */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">变更内容</h3>
                  
                  {preprint.pendingTitle && preprint.pendingTitle !== preprint.title && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">标题变更:</span>
                      <div className="text-sm line-through text-muted-foreground">{preprint.title}</div>
                      <div className="text-sm font-medium text-green-600">{preprint.pendingTitle}</div>
                    </div>
                  )}

                  {preprint.pendingAuthors && preprint.pendingAuthors !== preprint.authors && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">作者变更:</span>
                      <div className="text-sm line-through text-muted-foreground">{preprint.authors}</div>
                      <div className="text-sm font-medium text-green-600">{preprint.pendingAuthors}</div>
                    </div>
                  )}

                  {preprint.pendingAbstract && preprint.pendingAbstract !== preprint.abstract && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">摘要变更:</span>
                      <div className="text-sm line-clamp-3 text-muted-foreground">{preprint.abstract}</div>
                      <div className="text-sm line-clamp-3 text-green-600">{preprint.pendingAbstract}</div>
                    </div>
                  )}

                  {preprint.pendingPdfUrl && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">文件变更:</span>
                      <div className="flex items-center gap-2 text-sm">
                        <a href={preprint.pdfUrl} target="_blank" className="text-blue-500 hover:underline">旧文件</a>
                        <ArrowRight className="h-3 w-3" />
                        <a href={preprint.pendingPdfUrl} target="_blank" className="text-green-600 font-medium hover:underline">新文件</a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-center items-end gap-3 border-l pl-6">
                   <form action={reviewPreprintUpdate}>
                      <input type="hidden" name="preprintId" value={preprint.id} />
                      <input type="hidden" name="action" value="approve" />
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                        <Check className="mr-2 h-4 w-4" />
                        通过更新
                      </Button>
                   </form>
                   
                   <form action={reviewPreprintUpdate}>
                      <input type="hidden" name="preprintId" value={preprint.id} />
                      <input type="hidden" name="action" value="reject" />
                      <Button type="submit" variant="destructive" className="w-full">
                        <X className="mr-2 h-4 w-4" />
                        拒绝更新
                      </Button>
                   </form>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
