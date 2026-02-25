import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Eye, Star } from "lucide-react"

export default async function AuthorDashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  const myArticlesCount = await prisma.novel.count({ where: { uploaderId: userId } })
  const myTotalViews = await prisma.novel.aggregate({
    where: { uploaderId: userId },
    _sum: { views: true }
  })
  
  // Calculate average rating if needed, or just sum
  const myTotalRating = await prisma.novel.aggregate({
      where: { uploaderId: userId },
      _avg: { rating: true }
  })

  const stats = [
    { title: "已投稿件", value: myArticlesCount, icon: BookOpen },
    { title: "总浏览量", value: myTotalViews._sum.views || 0, icon: Eye },
    { title: "平均评分", value: myTotalRating._avg.rating?.toFixed(1) || "0.0", icon: Star },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">投稿概览</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
