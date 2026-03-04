import { prisma } from "@/lib/prisma"
import { PaperCard } from "@/components/paper-card"
import { Metadata } from "next"
import { BookX, FileText, Presentation, Award, Landmark, GraduationCap } from "lucide-react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "搜索结果",
}

interface SearchPageProps {
  searchParams: Promise<{ q: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  
  if (!q) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold">请输入搜索关键词</h1>
      </div>
    )
  }

  // Parallel search across different entities
  const [novels, journals, conferences, funds, awards] = await Promise.all([
    prisma.novel.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { author: { contains: q } },
          { description: { contains: q } },
        ],
      },
      orderBy: { views: 'desc' },
      take: 20,
      include: {
        journal: { select: { id: true, name: true } }
      }
    }),
    prisma.journal.findMany({
      where: { name: { contains: q } },
      take: 5
    }),
    prisma.conference.findMany({
      where: { name: { contains: q } },
      take: 5
    }),
    prisma.fund.findMany({
      where: { title: { contains: q } },
      take: 5
    }),
    prisma.award.findMany({
      where: { name: { contains: q } },
      take: 5
    })
  ]);

  const totalResults = novels.length + journals.length + conferences.length + funds.length + awards.length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">搜索结果</h1>
        <p className="text-muted-foreground">
          关键词 &quot;{q}&quot; 共找到 {totalResults} 个相关结果
        </p>
      </div>

      {totalResults === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border rounded-lg bg-muted/10">
          <div className="bg-muted/50 p-6 rounded-full mb-4">
            <BookX className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">没有找到相关内容</h3>
          <p className="mt-2 text-sm max-w-sm mx-auto">
            请尝试更换关键词重新搜索
          </p>
        </div>
      ) : (
        <div className="space-y-8">
            {/* Journals Section */}
            {journals.length > 0 && (
                <section>
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">期刊 ({journals.length})</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {journals.map((journal) => (
                    <Link key={journal.id} href={`/journals/${journal.id}`} className="block h-full">
                        <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-lg">{journal.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{journal.description || "暂无描述"}</CardDescription>
                        </CardHeader>
                        </Card>
                    </Link>
                    ))}
                </div>
                </section>
            )}

            {/* Conferences Section */}
            {conferences.length > 0 && (
                <section>
                <div className="flex items-center gap-2 mb-4">
                    <Presentation className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">会议 ({conferences.length})</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {conferences.map((conf) => (
                    <Link key={conf.id} href={`/conferences/${conf.id}`} className="block h-full">
                        <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-lg">{conf.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{conf.description || "暂无描述"}</CardDescription>
                        </CardHeader>
                        </Card>
                    </Link>
                    ))}
                </div>
                </section>
            )}

            {/* Funds Section */}
            {funds.length > 0 && (
                <section>
                <div className="flex items-center gap-2 mb-4">
                    <Landmark className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">基金 ({funds.length})</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {funds.map((fund) => (
                    <Link key={fund.id} href={`/fund/projects/${fund.id}`} className="block h-full">
                        <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-lg">{fund.title}</CardTitle>
                            <CardDescription>{fund.year}年度</CardDescription>
                        </CardHeader>
                        </Card>
                    </Link>
                    ))}
                </div>
                </section>
            )}

            {/* Awards Section */}
            {awards.length > 0 && (
                <section>
                <div className="flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">奖项 ({awards.length})</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {awards.map((award) => (
                    <Link key={award.id} href={`/awards/${award.id}`} className="block h-full">
                        <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-lg">{award.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{award.description || "暂无描述"}</CardDescription>
                        </CardHeader>
                        </Card>
                    </Link>
                    ))}
                </div>
                </section>
            )}

            {/* Papers (Novels) Section */}
            {novels.length > 0 && (
                <section>
                <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">论文 ({novels.length})</h2>
                </div>
                <div className="grid gap-4">
                    {novels.map((novel: any) => (
                    <PaperCard key={novel.id} paper={novel} />
                    ))}
                </div>
                </section>
            )}
        </div>
      )}
    </div>
  )
}
