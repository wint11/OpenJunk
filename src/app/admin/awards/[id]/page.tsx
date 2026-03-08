import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditAwardForm } from "./edit-form"
import { PrizeLevelsManager } from "./prize-levels-manager"
import { TracksManager } from "./tracks-manager"
import { CyclesManager } from "./cycles-manager"
import { ClearDataButton } from "./clear-data-button"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AdminAwardEditPage({ params }: { params: { id: string } }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const { id } = await params

  // 获取用户信息和奖项信息
  const [user, award] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, managedAwardId: true }
    }),
    prisma.award.findUnique({
      where: { id },
      include: {
        prizeLevels: {
          orderBy: { order: 'asc' }
        },
        tracks: {
          orderBy: { order: 'asc' },
          include: {
            journals: { select: { id: true, name: true } }
          }
        },
        cycles: {
          orderBy: { startDate: 'desc' }
        }
      }
    })
  ])

  if (!award) {
    notFound()
  }

  const isSuperAdmin = user?.role === "SUPER_ADMIN"
  const isAwardAdmin = user?.managedAwardId === id

  // 只有超级管理员或该奖项的管理员可以访问
  if (!isSuperAdmin && !isAwardAdmin) {
    redirect("/admin")
  }

  // 获取所有期刊供选择
  const journals = await prisma.journal.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/awards">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">编辑奖项: {award.name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <EditAwardForm award={award} />
          </CardContent>
        </Card>

        {/* 奖项等级配置 */}
        <Card>
          <CardHeader>
            <CardTitle>奖项等级配置</CardTitle>
          </CardHeader>
          <CardContent>
            <PrizeLevelsManager awardId={award.id} prizeLevels={award.prizeLevels} />
          </CardContent>
        </Card>

        {/* 赛道管理 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>赛道管理</CardTitle>
          </CardHeader>
          <CardContent>
            <TracksManager awardId={award.id} tracks={award.tracks} journals={journals} />
          </CardContent>
        </Card>

        {/* 周期管理 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>奖项周期管理</CardTitle>
          </CardHeader>
          <CardContent>
            <CyclesManager awardId={award.id} cycles={award.cycles} />
          </CardContent>
        </Card>

        {/* 数据管理 */}
        <Card className="lg:col-span-2 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              危险操作
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">清空奖项数据</p>
                <p className="text-sm text-muted-foreground">
                  此操作将删除该奖项的所有申请、评审、周期、赛道和等级数据，但保留奖项基本信息。
                </p>
              </div>
              <ClearDataButton awardId={award.id} awardName={award.name} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
