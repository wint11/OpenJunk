
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import Image from "next/image"

export const metadata = {
  title: "奖项矩阵 - OpenJunk",
  description: "浏览OpenJunk旗下的所有垃圾奖项",
}

export default async function AwardsPage() {
  const awards = await prisma.award.findMany({
    where: { status: 'ACTIVE' },
    include: {
      _count: {
        select: { admins: true, applications: true }
      }
    },
  })

  // Sort awards by name (supports Pinyin for Chinese)
  awards.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">奖项矩阵</h1>
        <p className="text-muted-foreground">
          OpenJunk 设立了多个针对不同领域的学术垃圾奖项，表彰在制造学术垃圾方面做出杰出贡献的个人和团体。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {awards.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground">
             <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
             <p>暂无活跃的奖项，您可以点击上方菜单 <Link href="/awards/new" className="text-primary hover:underline">创办奖项</Link></p>
          </div>
        ) : (
          awards.map((award) => (
            <Card key={award.id} className="group hover:shadow-md transition-all duration-300 border-muted/60 bg-card">
              <div className="p-5 flex flex-col h-full">
                {/* Award Title Row */}
                <div className="mb-4 flex items-center gap-2 overflow-hidden">
                    <Trophy className="h-5 w-5 text-yellow-500 shrink-0" />
                    <h3 className="font-bold text-lg leading-tight text-foreground truncate" title={award.name}>
                       {award.name}
                    </h3>
                 </div>

                <div className="flex gap-4 flex-1">
                  {/* Left: Description & Stats */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                     <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed mb-3">
                       {award.description || "暂无描述"}
                     </p>
                     
                     <div className="flex flex-wrap gap-2 mt-auto">
                        <Badge variant="secondary" className="h-6 text-xs font-normal px-2 bg-muted/50 text-muted-foreground hover:bg-muted">
                          <Users className="mr-1 h-3 w-3" />
                          {award._count.applications} 申请/提名
                        </Badge>
                     </div>
                  </div>
                  
                  {/* Right: Cover Image */}
                  <div className="shrink-0">
                    <div className="w-24 h-32 relative rounded-md overflow-hidden border shadow-sm bg-muted/30">
                      {award.coverUrl ? (
                        <Image 
                          src={award.coverUrl} 
                          alt={award.name} 
                          fill 
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                           <Trophy className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Footer Actions */}
                <div className="mt-5 pt-4 border-t border-muted/50 flex items-center justify-between">
                   <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-primary px-0" asChild>
                     <Link href={`/awards/${award.id}`}>
                       查看详情 <ArrowRight className="ml-1 h-3 w-3" />
                     </Link>
                   </Button>
                   <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                      <Link href={`/awards/application?awardId=${award.id}`}>
                        立即申请
                      </Link>
                   </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
