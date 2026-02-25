import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UserIcon, TagIcon, FileTextIcon, CheckCircle2, XCircle, Globe, AlertTriangle } from "lucide-react"
import { NovelAuditActions } from "../novel-audit-actions"
import { existsSync } from "fs"
import { join } from "path"

export default async function NovelAuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = session?.user?.role ?? ""
  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(role)) redirect("/")

  const { id } = await params
  const novel = await prisma.novel.findUnique({
    where: { id },
    include: { uploader: true }
  })

  if (!novel) return <div>未找到该论文</div>

  // Permission check
  if (role === 'ADMIN') {
    const currentUser = await prisma.user.findUnique({ where: { id: session?.user?.id } })
    if (currentUser?.managedJournalId && novel.journalId !== currentUser.managedJournalId) {
        redirect("/admin/audit/novels")
    }
    if (!currentUser?.managedJournalId) {
        redirect("/admin/audit/novels")
    }
  } else if (role === 'REVIEWER') {
    const currentUser = await prisma.user.findUnique({ 
        where: { id: session?.user?.id },
        include: { reviewerJournals: true }
    })
    const hasAccess = currentUser?.reviewerJournals.some(j => j.id === novel.journalId)
    if (!hasAccess) {
        redirect("/admin/audit/novels")
    }
  }

  // Check if PDF file exists
  // Remove leading slash to ensure correct joining with process.cwd()
  const relativePdfPath = novel.pdfUrl ? novel.pdfUrl.replace(/^\//, '') : '';
  const pdfPath = relativePdfPath ? join(process.cwd(), 'public', relativePdfPath) : null;
  const pdfExists = pdfPath ? existsSync(pdfPath) : false

  // Debug info for server-side
  if (!pdfExists && novel.pdfUrl) {
      console.log(`[PDF Check Failed] URL: ${novel.pdfUrl}`);
      console.log(`[PDF Check Failed] CWD: ${process.cwd()}`);
      console.log(`[PDF Check Failed] Expected: ${pdfPath}`);
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileTextIcon className="h-6 w-6" />
            论文审稿
          </h1>
          <p className="text-muted-foreground text-sm">
            ID: {novel.id}
          </p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline">{novel.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Column: PDF Viewer */}
        <div className="lg:col-span-2 h-full bg-muted/10 rounded-lg border overflow-hidden flex flex-col">
            {novel.pdfUrl && pdfExists ? (
                <iframe 
                    src={novel.pdfUrl} 
                    className="w-full h-full flex-1"
                    title="PDF Viewer"
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                    {novel.pdfUrl ? (
                        <>
                            <AlertTriangle className="h-16 w-16 mb-4 text-yellow-500" />
                            <p className="text-lg font-medium text-foreground">文件无法预览</p>
                            <p className="text-sm mt-2">虽然数据库中存在记录，但在服务器上未找到PDF文件。</p>
                            <p className="text-xs mt-1 text-muted-foreground font-mono bg-muted p-2 rounded">
                                Expected path: {pdfPath}
                            </p>
                        </>
                    ) : (
                        <>
                            <FileTextIcon className="h-16 w-16 mb-4 opacity-20" />
                            <p>未上传PDF文件</p>
                        </>
                    )}
                </div>
            )}
        </div>

        {/* Right Column: Metadata & Actions */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-1">
            {/* Metadata Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">标题</Label>
                        <div className="font-medium text-lg leading-tight">{novel.title}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <UserIcon className="h-3 w-3" /> 第一作者
                            </Label>
                            <div className="text-sm">{novel.author}</div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <TagIcon className="h-3 w-3" /> 分类
                            </Label>
                            <div className="text-sm">{novel.category}</div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Globe className="h-3 w-3" /> 提交IP
                        </Label>
                        <div className="text-sm font-mono">
                            {novel.uploaderIp || '未知 (匿名)'}
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">摘要</Label>
                        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md min-h-[80px]">
                            {novel.description}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Review Action Card */}
            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg">审稿意见</CardTitle>
                    <CardDescription>
                        请仔细阅读论文内容，并给出专业的评审意见。
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <NovelAuditActions 
                      novelId={novel.id} 
                      pdfUrl={novel.pdfUrl} 
                      title={novel.title}
                      author={novel.author}
                      description={novel.description}
                    />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
