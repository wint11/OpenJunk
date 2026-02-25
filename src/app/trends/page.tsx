import { prisma } from "@/lib/prisma"
import { PaperCard } from "@/components/paper-card"
import { Flame, TrendingUp } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "趋势榜 - OpenJunk",
  description: "全站最热门的学术垃圾",
}

export default async function TrendsPage() {
  const trendingPapers = await prisma.novel.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { popularity: 'desc' },
    take: 10,
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
      <div className="flex flex-col items-center mb-12 space-y-4 text-center">
        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
          <Flame className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          全站趋势榜
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          实时追踪最受关注的学术成果，基于浏览、下载、评论等多维度热度计算
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        {trendingPapers.length > 0 ? (
          trendingPapers.map((paper, index) => (
            <div key={paper.id} className="relative group">
              {/* Ranking Badge */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-full pr-4 hidden md:flex flex-col items-center">
                <span className={`text-4xl font-black italic ${
                  index < 3 ? 'text-primary/80' : 'text-muted-foreground/30'
                }`}>
                  #{index + 1}
                </span>
              </div>
              
              <PaperCard paper={paper} />
              
              {/* Mobile Ranking Badge */}
              <div className="md:hidden absolute -top-3 -left-2 z-10">
                <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm ${
                   index < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">暂无趋势数据</h3>
            <p className="text-muted-foreground">快去探索更多有趣的论文吧！</p>
          </div>
        )}
      </div>
    </div>
  )
}
