import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, User, Calendar, BookOpen, Layers } from "lucide-react"

export default async function FundProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const project = await prisma.fundApplication.findUnique({
    where: { id },
    include: {
      fund: {
        include: {
            category: true
        }
      },
      novels: {
        where: { status: 'PUBLISHED' },
        include: {
            journal: true
        }
      }
    }
  })

  if (!project) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10 min-h-screen space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/fund/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl">{project.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <span className="font-mono bg-muted px-1 rounded text-xs">{project.serialNo || '无编号'}</span>
                                <span>{project.fund.year}年度 {project.fund.category.name}</span>
                            </CardDescription>
                        </div>
                        <Badge className="bg-green-600">已立项</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-primary" />
                            项目简介
                        </h3>
                        <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-4 rounded-md">
                            {project.description}
                        </div>
                    </div>

                    {project.achievements && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center">
                                <Layers className="mr-2 h-5 w-5 text-primary" />
                                预期成果/已有基础
                            </h3>
                            <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-4 rounded-md">
                                {project.achievements}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Related Papers */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <BookOpen className="mr-2 h-5 w-5 text-primary" />
                        已发表成果 ({project.novels.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {project.novels.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            暂无关联的发表成果
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {project.novels.map(novel => (
                                <div key={novel.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="space-y-1">
                                        <Link href={`/novel/${novel.id}`} className="font-medium hover:underline text-lg">
                                            {novel.title}
                                        </Link>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                                            <span>{novel.author}</span>
                                            <span>•</span>
                                            <span className="text-primary">{novel.journal?.name || '未知期刊'}</span>
                                            <span>•</span>
                                            <span>{new Date(novel.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" asChild className="mt-2 sm:mt-0 shrink-0">
                                        <Link href={`/novel/${novel.id}`}>阅读全文</Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>项目信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-muted-foreground flex items-center text-sm">
                            <User className="mr-2 h-4 w-4" /> 负责人
                        </span>
                        <span className="font-medium">{project.applicantName}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-muted-foreground flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4" /> 立项年份
                        </span>
                        <span className="font-medium">{project.fund.year}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-muted-foreground flex items-center text-sm">
                            <Layers className="mr-2 h-4 w-4" /> 所属基金
                        </span>
                        <span className="font-medium text-right">{project.fund.title}</span>
                    </div>
                     <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-muted-foreground flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4" /> 起止时间
                        </span>
                        <span className="font-medium text-sm">
                            {new Date(project.fund.startDate).toLocaleDateString()} - {new Date(project.fund.endDate).toLocaleDateString()}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}