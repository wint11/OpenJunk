
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
            <Card key={conference.id} className="group relative overflow-hidden h-64 hover:shadow-xl transition-all duration-300 border-none bg-muted rounded-xl">
              {/* Background Image */}
              {conference.coverUrl ? (
                <div className="absolute inset-0 z-0">
                  <Image 
                    src={conference.coverUrl} 
                    alt={conference.name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                </div>
              ) : (
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-muted/50">
                   <span className="text-muted-foreground font-bold text-xl">{conference.name}</span>
                </div>
              )}

              {/* Hover Action Layer */}
              <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                 <Button size="lg" className="rounded-full px-8 shadow-2xl scale-90 transition-transform duration-300 group-hover:scale-100 bg-white text-black hover:bg-white/90" asChild>
                   <Link href={`/conferences/${conference.id}`}>
                     查看详情
                   </Link>
                 </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
