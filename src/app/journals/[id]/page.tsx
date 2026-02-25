import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, FileText, Users } from "lucide-react"
import Link from "next/link"

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
        select: { papers: true, admins: true, reviewers: true }
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

  return (
    <div className="container mx-auto py-12 px-4 space-y-12">
      {/* Journal Header */}
      <section className="bg-muted/30 p-8 rounded-xl border flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
             <BookOpen className="h-8 w-8 text-primary" />
             <h1 className="text-3xl font-bold tracking-tight">{journal.name}</h1>
             {journal.status === 'ARCHIVED' && <Badge variant="secondary">已归档</Badge>}
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {journal.description || "暂无描述"}
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground pt-2">
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

      {/* Papers List */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight border-l-4 border-primary pl-4">
          最新录用
        </h2>
        
        {journal.papers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {journal.papers.map((paper) => (
              <Card key={paper.id} className="group hover:shadow-md transition-all">
                <CardHeader>
                   <Link href={`/novel/${paper.id}`} className="block hover:underline decoration-primary underline-offset-4">
                      <CardTitle className="line-clamp-1">{paper.title}</CardTitle>
                   </Link>
                   <CardDescription className="flex items-center gap-2 text-xs">
                      <span>{paper.author}</span>
                      <span>•</span>
                      <span>{paper.updatedAt.toLocaleDateString()}</span>
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">{paper.category}</Badge>
                   </CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground line-clamp-3">
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
      </section>
    </div>
  )
}
