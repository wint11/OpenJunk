import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, FileText, Users, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import { JournalCustomRenderer } from "./custom-renderer"

interface JournalDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: JournalDetailPageProps) {
  const params = await props.params;
  const journal = await prisma.journal.findUnique({
    where: { id: params.id },
  })
  if (!journal) return { title: "期刊未找到" }
  return {
    title: journal.name,
    description: journal.description,
  }
}

export default async function JournalDetailPage(props: JournalDetailPageProps) {
  const params = await props.params;
  const journal = await prisma.journal.findUnique({
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

  if (!journal) {
    notFound()
  }

  if (journal.customConfig) {
    // We need to serialize the data to pass it to the client renderer
    const journalData = {
        name: journal.name,
        description: journal.description,
        paperCount: journal._count.papers,
        adminCount: journal._count.admins + journal._count.reviewers,
        createdAt: journal.createdAt.toLocaleDateString(),
        guidelines: journal.guidelines,
        guidelinesUrl: journal.guidelinesUrl,
        papers: journal.papers.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            author: p.uploader?.name || "匿名作者",
            date: p.updatedAt.toLocaleDateString(),
            category: p.category
        }))
    }
    // We must pass the code and data to a CLIENT component to render the iframe
    return <JournalCustomRenderer code={journal.customConfig} data={journalData} />
  }

  return (
    <div className="container mx-auto py-12 px-4 space-y-12 journal-container">
      {/* Journal Header */}
      <section className="bg-muted/30 p-8 rounded-xl border flex flex-col md:flex-row gap-8 items-start journal-header">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
             <BookOpen className="h-8 w-8 text-primary" />
             <h1 className="text-3xl font-bold tracking-tight journal-title">{journal.name}</h1>
             {journal.status === 'ARCHIVED' && <Badge variant="secondary">已归档</Badge>}
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed journal-description">
            {journal.description || "暂无描述"}
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground pt-2 journal-meta">
            <span className="flex items-center gap-1.5">
               <FileText className="h-4 w-4" />
               已收录 {journal._count.papers} 篇论文
            </span>
            <span className="flex items-center gap-1.5">
               <Users className="h-4 w-4" />
               {journal._count.admins + journal._count.reviewers} 位编辑
            </span>
            <span className="flex items-center gap-1.5">
               <Calendar className="h-4 w-4" />
               创建于 {journal.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content: Guidelines & Papers */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-12">
        {/* Left Column: Submission Guidelines (40%) */}
        <aside className="lg:col-span-4 space-y-6 journal-guidelines-section">
          <h2 className="text-2xl font-bold tracking-tight border-l-4 border-primary pl-4 journal-guidelines-title">
             投稿指南
          </h2>
           <div className="bg-muted/10 rounded-xl border p-6 space-y-4 journal-guidelines-content">
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground break-words">
                 {journal.guidelines ? (
                    <ReactMarkdown
                      components={{
                        h1: (props) => <h1 className="text-xl font-bold mt-6 mb-4 text-foreground" {...props} />,
                        h2: (props) => <h2 className="text-lg font-bold mt-5 mb-3 text-foreground" {...props} />,
                        h3: (props) => <h3 className="text-base font-bold mt-4 mb-2 text-foreground" {...props} />,
                        p: (props) => <p className="mb-4 leading-relaxed" {...props} />,
                        ul: (props) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                        ol: (props) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                        li: (props) => <li className="pl-1" {...props} />,
                        blockquote: (props) => <blockquote className="border-l-4 border-muted pl-4 italic my-4 text-muted-foreground" {...props} />,
                        a: (props) => <a className="text-primary hover:underline underline-offset-4" target="_blank" rel="noopener noreferrer" {...props} />,
                        code: (props) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                      }}
                    >
                      {journal.guidelines}
                    </ReactMarkdown>
                 ) : (
                    "该期刊暂未发布详细的投稿指南。"
                 )}
              </div>
              {journal.guidelinesUrl && (
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <a href={journal.guidelinesUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      下载投稿附件
                    </a>
                  </Button>
                </div>
              )}
           </div>
        </aside>

        {/* Right Column: Latest Papers (60%) */}
        <main className="lg:col-span-6 space-y-6 journal-papers-section">
          <h2 className="text-2xl font-bold tracking-tight border-l-4 border-primary pl-4 journal-papers-title">
            最新录用
          </h2>
          
          {journal.papers.length > 0 ? (
            <div className="flex flex-col gap-4">
              {journal.papers.map((paper) => (
                <Card key={paper.id} className="group hover:shadow-md transition-all journal-paper-card">
                  <CardHeader className="pb-2">
                     <Link href={`/novel/${paper.id}`} className="block hover:underline decoration-primary underline-offset-4">
                        <CardTitle className="text-lg line-clamp-1 journal-paper-title">{paper.title}</CardTitle>
                     </Link>
                     <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 journal-paper-meta">
                        <span>{paper.uploader?.name || "匿名作者"}</span>
                        <span>•</span>
                        <span>{new Date(paper.updatedAt).toLocaleDateString()}</span>
                        {paper.category && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">{paper.category}</Badge>}
                     </div>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-muted-foreground line-clamp-2 journal-paper-abstract">
                       {paper.description || "暂无摘要"}
                     </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
              <p>该期刊暂无已发表论文</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
