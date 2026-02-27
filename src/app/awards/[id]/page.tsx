
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Calendar, ArrowLeft } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const award = await prisma.award.findUnique({
    where: { id },
    select: { name: true, description: true }
  })

  if (!award) return { title: "奖项不存在" }

  return {
    title: `${award.name} - OpenJunk`,
    description: award.description,
  }
}

export default async function AwardDetailPage({ params }: PageProps) {
  const { id } = await params
  const award = await prisma.award.findUnique({
    where: { id },
    include: {
      _count: {
        select: { applications: true }
      },
      admins: {
        select: { name: true, email: true }
      }
    }
  })

  if (!award) {
    notFound()
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" asChild>
        <Link href="/awards">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回奖项列表
        </Link>
      </Button>

      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        {/* Left Column: Cover & Quick Stats */}
        <div className="space-y-6">
          <div className="aspect-[3/4] relative rounded-lg overflow-hidden border shadow-sm bg-muted/30">
            {award.coverUrl ? (
              <Image 
                src={award.coverUrl} 
                alt={award.name} 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 p-4">
                 <Trophy className="h-20 w-20 mb-4" />
                 <p className="text-sm">暂无封面</p>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">奖项信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center">
                  <Calendar className="mr-2 h-4 w-4" /> 创建时间
                </span>
                <span>{award.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center">
                  <Users className="mr-2 h-4 w-4" /> 申请人数
                </span>
                <Badge variant="secondary">{award._count.applications}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">组委会成员</span>
                <div className="flex flex-wrap gap-1">
                  {award.admins.map((admin, i) => (
                    <Badge key={i} variant="outline" className="font-normal">
                      {admin.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" asChild>
            <Link href={`/awards/application?awardId=${award.id}`}>
              立即申请 / 提名
            </Link>
          </Button>
        </div>

        {/* Right Column: Details */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4 flex items-center gap-3">
              {award.name}
              {award.status === 'ACTIVE' ? (
                <Badge className="bg-green-600 hover:bg-green-700">进行中</Badge>
              ) : (
                <Badge variant="secondary">已归档</Badge>
              )}
            </h1>
          </div>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold border-b pb-2">奖项介绍</h2>
            <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {award.description || "暂无描述"}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold border-b pb-2">评选标准</h2>
            <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {award.criteria || "暂无评选标准说明"}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
