import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Users, Mic2, MapPin, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ConferenceDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: ConferenceDetailPageProps) {
  const params = await props.params;
  const conference = await prisma.conference.findUnique({
    where: { id: params.id },
  })
  if (!conference) return { title: "会议未找到" }
  return {
    title: conference.name,
    description: conference.description,
  }
}

export default async function ConferenceDetailPage(props: ConferenceDetailPageProps) {
  const params = await props.params;
  const conference = await prisma.conference.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: { 
            papers: {
                where: { status: 'PUBLISHED' }
            },
            admins: true, 
            reviewers: true 
        }
      },
      papers: {
        where: { status: 'PUBLISHED' },
        orderBy: { updatedAt: 'desc' },
        include: {
            uploader: true
        }
      }
    }
  })

  if (!conference) {
    notFound()
  }

  // Determine conference status label
  const now = new Date()
  let statusLabel = "筹备中"
  if (conference.status === 'COMPLETED' || now > conference.endDate) {
      statusLabel = "已结束"
  } else if (conference.status === 'CANCELLED') {
      statusLabel = "已取消"
  } else if (now >= conference.startDate && now <= conference.endDate) {
      statusLabel = "进行中"
  }

  return (
    <div className="container mx-auto py-12 px-4 space-y-12">
      {/* Conference Header */}
      <section className="bg-muted/30 rounded-xl border overflow-hidden">
        <div className="flex flex-col md:flex-row">
            {/* Cover Image */}
            <div className="md:w-1/3 h-64 md:h-auto relative bg-muted">
                {conference.coverUrl ? (
                    <Image 
                        src={conference.coverUrl} 
                        alt={conference.name} 
                        fill 
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                        <Mic2 className="h-20 w-20" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 p-8 flex flex-col justify-center space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant={statusLabel === "已结束" || statusLabel === "已取消" ? "secondary" : "default"}>
                            {statusLabel}
                        </Badge>
                        <h1 className="text-3xl font-bold tracking-tight">{conference.name}</h1>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{conference.location || "线上会议"}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{conference.startDate.toLocaleDateString()}</span>
                        <span className="text-xs">至</span>
                        <span>{conference.endDate.toLocaleDateString()}</span>
                    </div>
                </div>

                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                    {conference.description || "暂无描述"}
                </p>

                <div className="flex gap-4 pt-2">
                    <Button asChild>
                        <Link href={`/conferences/submission?conferenceId=${conference.id}`}>
                            立即投稿 <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    {conference.guidelinesUrl && (
                        <Button variant="outline" asChild>
                            <a href={conference.guidelinesUrl} download target="_blank" rel="noopener noreferrer">
                                下载会议指南
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </div>
        
        {/* Stats Bar */}
        <div className="bg-muted/50 px-8 py-3 border-t flex gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
               <FileText className="h-4 w-4" />
               已录用 {conference._count.papers} 篇论文
            </span>
            <span className="flex items-center gap-2">
               <Users className="h-4 w-4" />
               {conference._count.admins + conference._count.reviewers} 位委员会成员
            </span>
        </div>
      </section>

      {/* Main Content: Papers */}
      <main className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight border-l-4 border-primary pl-4">
                会议论文集
            </h2>
          </div>
          
          {conference.papers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {conference.papers.map((paper) => (
                <Card key={paper.id} className="group hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                     <Link href={`/novel/${paper.id}`} className="block hover:underline decoration-primary underline-offset-4">
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {paper.title}
                        </CardTitle>
                     </Link>
                     <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <Users className="h-3 w-3" />
                        <span>{paper.author || paper.uploader?.name || "匿名作者"}</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(paper.updatedAt).toLocaleDateString()}</span>
                     </div>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                       {paper.description || "暂无摘要"}
                     </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>本次会议暂无已发表论文</p>
            </div>
          )}
      </main>
    </div>
  )
}
