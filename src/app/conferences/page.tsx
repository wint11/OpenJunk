
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FileText, Users, Mic2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import Image from "next/image"

export const metadata = {
  title: "会议矩阵 - OpenJunk",
  description: "浏览OpenJunk旗下的所有垃圾会议",
}

export default async function ConferencesPage() {
  const conferences = await prisma.conference.findMany({
    where: { 
        status: 'ACTIVE',
    },
    include: {
      _count: {
        select: { admins: true, reviewers: true }
      }
    },
  })

  // Fetch published paper counts manually for accuracy
  const conferencesWithCounts = await Promise.all(conferences.map(async (c) => {
    const paperCount = await prisma.novel.count({
      where: {
        conferenceId: c.id,
        status: 'PUBLISHED'
      }
    })
    return {
      ...c,
      publishedPaperCount: paperCount
    }
  }))

  // Sort conferences by name (supports Pinyin for Chinese)
  conferencesWithCounts.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">学术会议</h1>
        <p className="text-muted-foreground">
          OpenJunk 拥有多个针对不同领域（或不分领域）的垃圾学术会议矩阵。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {conferencesWithCounts.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground">
             <Mic2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
             <p>暂无活跃的学术会议，您可以点击上方菜单 <Link href="/conferences/new" className="text-primary hover:underline">创办会议</Link></p>
          </div>
        ) : (
          conferencesWithCounts.map((conference) => (
            <Card key={conference.id} className="group hover:shadow-md transition-all duration-300 border-muted/60 bg-card">
              <div className="p-5 flex flex-col h-full">
                {/* Conference Title Row - Spans full width */}
                <div className="mb-4 flex items-center gap-2 overflow-hidden">
                    <Mic2 className="h-5 w-5 text-primary shrink-0" />
                    <h3 className="font-bold text-lg leading-tight text-foreground truncate" title={conference.name}>
                       {conference.name}
                    </h3>
                 </div>

                <div className="flex gap-4 flex-1">
                  {/* Left: Description & Stats */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                     <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed mb-3">
                       {conference.description || "暂无描述"}
                     </p>
                     
                     <div className="flex flex-wrap gap-2 mt-auto">
                        <Badge variant="secondary" className="h-6 text-xs font-normal px-2 bg-muted/50 text-muted-foreground hover:bg-muted">
                          <FileText className="mr-1 h-3 w-3" />
                          {conference.publishedPaperCount} 篇
                        </Badge>
                        <Badge variant="secondary" className="h-6 text-xs font-normal px-2 bg-muted/50 text-muted-foreground hover:bg-muted">
                          <Users className="mr-1 h-3 w-3" />
                          {conference._count.admins + conference._count.reviewers} 委员
                        </Badge>
                     </div>
                  </div>
                  
                  {/* Right: Cover Image - Aligned with Description */}
                  <div className="shrink-0">
                    <div className="w-24 h-32 relative rounded-md overflow-hidden border shadow-sm bg-muted/30">
                      {conference.coverUrl ? (
                        <Image 
                          src={conference.coverUrl} 
                          alt={conference.name} 
                          fill 
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                           <Mic2 className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Footer Actions */}
                <div className="mt-5 pt-4 border-t border-muted/50 flex items-center justify-between">
                   <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-primary px-0" asChild>
                     <Link href={`/journals/${conference.id}`}>
                       查看详情 <ArrowRight className="ml-1 h-3 w-3" />
                     </Link>
                   </Button>
                   <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                      <Link href={`/conferences/submission?journalId=${conference.id}`}>
                        立即投稿
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
