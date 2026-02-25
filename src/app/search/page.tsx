import { prisma } from "@/lib/prisma"
import { PaperCard } from "@/components/paper-card"
import { Metadata } from "next"
import { Novel } from "@prisma/client"
import { BookX } from "lucide-react"

export const metadata: Metadata = {
  title: "搜索结果 - OpenJunk",
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

  const novels = await prisma.novel.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { author: { contains: q } },
        { description: { contains: q } },
      ],
    },
    orderBy: { views: 'desc' },
    include: {
      journal: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">搜索结果</h1>
        <p className="text-muted-foreground">
          关键词 &quot;{q}&quot; 共找到 {novels.length} 篇相关论文
        </p>
      </div>

      {novels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border rounded-lg bg-muted/10">
          <div className="bg-muted/50 p-6 rounded-full mb-4">
            <BookX className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">没有找到相关论文</h3>
          <p className="mt-2 text-sm max-w-sm mx-auto">
            请尝试更换关键词重新搜索
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {novels.map((novel: any) => (
            <PaperCard key={novel.id} paper={novel} />
          ))}
        </div>
      )}
    </div>
  )
}
