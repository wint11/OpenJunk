import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PublishManager } from "./publish-manager"

export default async function AwardPublishPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // 获取用户信息以检查权限
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, managedAwardId: true }
  })

  const isSuperAdmin = user?.role === "SUPER_ADMIN"
  const isAwardAdmin = user?.managedAwardId !== null

  // 只有超级管理员或奖项管理员可以访问
  if (!isSuperAdmin && !isAwardAdmin) {
    redirect("/admin")
  }

  // 获取可管理的奖项
  const awards = await prisma.award.findMany({
    where: isSuperAdmin ? {} : { id: user?.managedAwardId || "" },
    include: {
      prizeLevels: {
        orderBy: { order: 'asc' }
      },
      cycles: {
        orderBy: { startDate: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // 获取每个奖项的已评审但未发布的申请
  const awardsWithApplications = await Promise.all(
    awards.map(async (award) => {
      const applications = await prisma.awardApplication.findMany({
        where: {
          awardId: award.id,
          status: { notIn: ['PENDING', 'REVIEWING'] },
          isPublished: false
        },
        include: {
          prizeLevel: true,
          track: { select: { name: true } },
          cycle: { select: { id: true, name: true } },
          journal: { select: { name: true } },
          nominationPapers: { select: { title: true } }
        },
        orderBy: { reviewedAt: 'desc' }
      })

      return {
        ...award,
        applications
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">发布管理</h1>
      </div>

      {awardsWithApplications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            暂无可管理的奖项
          </CardContent>
        </Card>
      ) : (
        <PublishManager awards={awardsWithApplications} />
      )}
    </div>
  )
}
