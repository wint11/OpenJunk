import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Calendar, Eye, FileText, Download, Quote, Wallet, Activity } from "lucide-react"
import { AddToBookshelf } from "@/components/add-to-bookshelf"
import { CitationDialog } from "@/components/citation-dialog"

import { CommentSection } from "../comment-section"
import { incrementPopularity } from "@/lib/popularity"
import { Flame } from "lucide-react"
import { auth } from "@/auth"
import { AoiDisplay } from "./aoi-display"

interface NovelDetailPageProps {
  params: Promise<{
    id: string
  }>
}

import { DownloadButton } from "@/components/download-button"

export default async function NovelDetailPage({ params }: NovelDetailPageProps) {
  const { id } = await params
  const session = await auth()
  
  const novel = await prisma.novel.findFirst({
    where: { 
      id,
      status: 'PUBLISHED'
    },
    include: {
        journal: true,
        conference: true,
        fundApplications: {
            include: { fund: { include: { category: true } } }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, image: true, role: true }
            },
            likes: true,
            replies: {
              include: {
                user: {
                  select: { id: true, name: true, image: true, role: true }
                },
                likes: true,
                // Nested replies fetching strategy needs to be handled carefully in Prisma
                // Prisma supports recursive include but usually limited depth
                // For now, let's keep it simple.
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          where: { parentId: null }, // Fetch top-level comments
          orderBy: { createdAt: 'desc' }
        }
    }
  })

  if (!novel) {
    notFound()
  }

  // Increment popularity for VIEW
  // Using a fire-and-forget approach or client-side effect would be better for performance/caching,
  // but for simplicity we call it here. Since this is a Server Component, it runs on every request (if dynamic) or build time (if static).
  // Given we are using searchParams/cookies, this page is likely dynamic.
  incrementPopularity(id, 'VIEW')

  // Calculate total comments (including replies)
  const totalComments = await prisma.comment.count({
    where: { novelId: id }
  })

  // Get current IP to identify anonymous user's own comments
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const currentIp = headersList.get('x-forwarded-for') || '127.0.0.1'

  // Fetch user vote for AOI
  const userVoteRecord = await prisma.aoiVote.findUnique({
    where: {
      novelId_ip: {
        novelId: id,
        ip: currentIp
      }
    }
  })

  // Parse extra authors safely
  let extraAuthors: { name: string; unit: string; roles: string[] }[] = []
  try {
    if (novel.extraAuthors) {
        extraAuthors = JSON.parse(novel.extraAuthors)
    }
  } catch (e) {
    console.error("Failed to parse extra authors", e)
  }

  // Check for duplicate submissions
  const isDuplicate = novel.pdfHash ? (await prisma.novel.count({
    where: {
      pdfHash: novel.pdfHash,
      id: { not: id }
    }
  }) > 0) : false

  return (
    <div className="bg-background pb-12">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto h-14 flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <div className="bg-primary/10 p-1 rounded-md">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </div>
            返回首页
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
               <Link href="/journals/browse">浏览更多</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Header / Title Section */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="text-sm font-normal">
                {novel.category}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                发表于 {novel.updatedAt.toLocaleDateString('zh-CN')}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {Math.round(novel.popularity)} 热度
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
              {novel.title}
            </h1>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-lg font-medium text-primary">
                  {/* Since we have moved to structured author data, we should prefer that if available */}
                  {extraAuthors.length > 0 ? (
                    extraAuthors.map((author, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                            <span>{author.name}</span>
                            {author.unit && (
                                <span className="text-xs text-muted-foreground font-normal">({author.unit})</span>
                            )}
                        </div>
                    ))
                  ) : (
                    <span>{novel.author}</span>
                  )}
                </div>
                {novel.correspondingAuthor && (
                   <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span className="font-semibold">通讯作者:</span> {novel.correspondingAuthor}
                   </p>
                )}
                <p className="text-sm text-muted-foreground pt-1">
                  {novel.journal ? (
                    <Link href={`/journals/${novel.journal.id}`} className="hover:underline hover:text-primary">
                        发表于期刊：{novel.journal.name}
                    </Link>
                  ) : novel.conference ? (
                    <Link href={`/conferences/${novel.conference.id}`} className="hover:underline hover:text-primary">
                        发表于会议：{novel.conference.name}
                    </Link>
                  ) : (
                    "OpenJunk"
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                {/* Online Read Button */}
                {novel.pdfUrl && novel.pdfUrl.endsWith('.pdf') ? (
                  <Button size="lg" className="shadow-sm" asChild>
                    <Link href={`/novel/${novel.id}/read`}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      在线阅读PDF
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" className="shadow-sm" disabled>
                    <BookOpen className="mr-2 h-4 w-4" />
                    无法在线预览
                  </Button>
                )}

                {/* Download & Other Tools */}
                <div className="flex items-center gap-3">
                    {novel.pdfUrl && (
                      <DownloadButton novelId={novel.id} pdfUrl={novel.pdfUrl} />
                    )}
                    <CitationDialog novel={{ 
                        id: novel.id, 
                        title: novel.title, 
                        author: novel.author, 
                        createdAt: novel.createdAt,
                        journalName: novel.journal?.name || novel.conference?.name
                    }} />
                    <AddToBookshelf novel={{ id: novel.id, title: novel.title, author: novel.author, coverUrl: novel.coverUrl }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content: Abstract & Preview */}
        <div className="lg:col-span-2 space-y-10">
          {/* Fund Info */}
          {novel.fundApplications && novel.fundApplications.length > 0 && (
            <div className="bg-muted/30 border border-muted p-4 rounded-lg flex items-start gap-3">
              <div className="p-2 bg-background rounded-md shadow-sm">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">基金项目资助</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  {novel.fundApplications.map(app => (
                    <div key={app.id}>
                        <span className="mr-1">•</span>
                        本文由
                        <span className="mx-1 font-medium text-foreground">
                            {app.fund.category.name} ({app.fund.year})
                        </span>
                        资助，项目编号：
                        <span className="mx-1 font-mono text-foreground">{app.projectNo || '暂无'}</span>，
                        项目名称：
                        <span className="mx-1 font-medium text-primary">{app.title}</span>。
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <section className="space-y-4">
            <h2 className="text-xl font-bold border-l-4 border-primary pl-3">摘要</h2>
            <div className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              <p>{novel.description || "暂无摘要"}</p>
            </div>
          </section>

          <CommentSection 
            comments={novel.comments} 
            user={session?.user} 
            novelId={novel.id} 
            totalComments={totalComments}
            currentIp={currentIp}
          />
        </div>

        {/* Sidebar: Metadata & Tools */}
        <div className="space-y-8">
            <AoiDisplay 
              novelId={novel.id}
              aoiScore={novel.aoiScore || 0}
              aiScores={{
                rigor: novel.aiRigor || 0,
                reproducibility: novel.aiReproducibility || 0,
                standardization: novel.aiStandardization || 0,
                professionalism: novel.aiProfessionalism || 0,
                objectivity: novel.aiObjectivity || 0
              }}
              userVote={userVoteRecord?.voteType as 'OVERREACH' | 'MISCONDUCT' | null}
              isDuplicate={isDuplicate}
            />
        </div>
      </div>
    </div>
  )
}
