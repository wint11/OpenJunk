import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, FileText, Users } from "lucide-react"

export const metadata = {
  title: "期刊列表",
  description: "浏览OpenJunk旗下的所有垃圾期刊",
}

export default async function JournalsPage() {
  const journals = await prisma.journal.findMany({
    where: { status: 'ACTIVE' },
    include: {
      _count: {
        select: { papers: true, admins: true, reviewers: true }
      }
    },
  })

  // Sort journals by name (supports Pinyin for Chinese)
  journals.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">旗下期刊</h1>
        <p className="text-muted-foreground">
          OpenJunk 拥有多个针对不同领域（或不分领域）的垃圾期刊矩阵。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {journals.map((journal) => (
          <Card key={journal.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {journal.name}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {journal.description || "暂无描述"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {journal._count.papers} 篇论文
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {journal._count.admins + journal._count.reviewers} 位编辑
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/journals/${journal.id}`}>查看期刊</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
