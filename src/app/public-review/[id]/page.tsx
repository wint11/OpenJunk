
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DownloadButton } from "@/components/download-button"
import Link from "next/link"
import { ChevronLeft, Calendar, Edit } from "lucide-react"
import { auth } from "@/auth"

interface PreprintDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PreprintDetailPage({ params }: PreprintDetailPageProps) {
  const { id } = await params
  const session = await auth()
  
  // Try to find in Preprint table first
  let preprintData: any = await prisma.preprint.findUnique({
    where: { id },
  })

  let isNovel = false

  // If not found, try Novel table
  if (!preprintData) {
    const novel = await prisma.novel.findUnique({
      where: { id },
      include: {
        journal: true,
        conference: true
      }
    })
    
    if (novel) {
      isNovel = true
      preprintData = {
        id: novel.id,
        title: novel.title,
        abstract: novel.description,
        authors: novel.author,
        createdAt: novel.createdAt,
        pdfUrl: novel.pdfUrl,
        uploaderId: novel.uploaderId,
        updateStatus: 'IDLE' // Novels don't have update status in this view
      }
    }
  }

  if (!preprintData) {
    notFound()
  }

  // Permission check for update button
  // Only allow updates for actual Preprints, not Novels (which have their own flow)
  const isUploader = session?.user?.id && session.user.id === preprintData.uploaderId
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"
  const canUpdate = !isNovel && (isUploader || isSuperAdmin)

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <Link href="/preprints" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          返回预印本列表
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">
             预印本
          </Badge>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {preprintData.createdAt.toLocaleDateString('zh-CN')}
          </span>
          {preprintData.updateStatus === 'PENDING' && (
             <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
               更新审核中
             </Badge>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {preprintData.title}
        </h1>

        <div className="flex flex-col gap-1 text-lg">
            <span className="font-medium">{preprintData.authors}</span>
        </div>

        {/* Abstract / Description */}
        <div className="bg-muted/30 p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">摘要</h2>
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {preprintData.abstract || "暂无摘要"}
            </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
                {preprintData.pdfUrl ? (
                    <DownloadButton novelId={preprintData.id} pdfUrl={preprintData.pdfUrl} />
                ) : (
                    <Button disabled variant="outline">暂无文件</Button>
                )}
            </div>
            
            {canUpdate && (
                <Button variant="outline" asChild>
                    <Link href={`/preprints/${preprintData.id}/update`}>
                        <Edit className="mr-2 h-4 w-4" />
                        更新预印本
                    </Link>
                </Button>
            )}
        </div>
      </div>
    </div>
  )
}
