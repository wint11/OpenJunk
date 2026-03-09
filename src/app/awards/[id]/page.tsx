import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, Calendar, ArrowLeft, Clock, Route, Award, FileText, Medal, Info, BookOpen, ClipboardList, TrophyIcon } from "lucide-react"

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
      },
      cycles: {
        orderBy: { startDate: 'desc' }
      },
      tracks: {
        orderBy: { order: 'asc' },
        include: {
          journals: { select: { id: true, name: true } }
        }
      },
      prizeLevels: {
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!award) {
    notFound()
  }

  // 检查是否有开放的周期
  const hasOpenCycle = award.cycles.some(c => c.status === 'OPEN')
  const openCycles = award.cycles.filter(c => c.status === 'OPEN')

  // 获取已发布的申请（评审结果）
  const publishedApplications = await prisma.awardApplication.findMany({
    where: {
      awardId: id,
      isPublished: true,
      status: { notIn: ['PENDING', 'REVIEWING'] }
    },
    include: {
      prizeLevel: true,
      track: { select: { name: true } },
      cycle: { select: { name: true } },
      journal: { select: { name: true } },
      nominationPapers: { select: { id: true, title: true } }
    },
    orderBy: [
      { prizeLevel: { order: 'asc' } },
      { publishedAt: 'desc' }
    ]
  })

  // 按奖项等级分组
  const groupedByPrizeLevel = publishedApplications.reduce((acc, app) => {
    const levelName = app.prizeLevel?.name || '不予授奖'
    const levelColor = app.prizeLevel?.color || '#ef4444'
    const levelOrder = app.prizeLevel?.order || 999

    if (!acc[levelName]) {
      acc[levelName] = {
        levelName,
        levelColor,
        levelOrder,
        applications: []
      }
    }
    acc[levelName].applications.push(app)
    return acc
  }, {} as Record<string, { levelName: string; levelColor: string; levelOrder: number; applications: typeof publishedApplications }>)

  // 按 order 排序，如果 order 相同则按 levelName 排序
  const sortedGroups = Object.values(groupedByPrizeLevel).sort((a, b) => {
    if (a.levelOrder !== b.levelOrder) {
      return a.levelOrder - b.levelOrder
    }
    return a.levelName.localeCompare(b.levelName, 'zh-CN')
  })

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" asChild>
        <Link href="/awards">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回奖项列表
        </Link>
      </Button>

      {/* 顶部标题区 */}
      <div className="mb-8">
        <div className="flex items-start gap-6 mb-6">
          {/* 封面 */}
          <div className="w-32 h-40 relative rounded-lg overflow-hidden border shadow-sm bg-muted/30 flex-shrink-0">
            {award.coverUrl ? (
              <Image
                src={award.coverUrl}
                alt={award.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <Trophy className="h-10 w-10" />
              </div>
            )}
          </div>

          {/* 标题信息 */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{award.name}</h1>
              {award.status === 'ACTIVE' ? (
                <Badge className="bg-green-600 hover:bg-green-700">进行中</Badge>
              ) : (
                <Badge variant="secondary">已归档</Badge>
              )}
            </div>

            {/* 统计信息 */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {award._count.applications} 人申请
              </span>
              {publishedApplications.length > 0 && (
                <span className="flex items-center gap-1">
                  <Medal className="h-4 w-4" />
                  {publishedApplications.length} 人已公布
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {award.createdAt.toLocaleDateString()} 创建
              </span>
            </div>

            {/* 组委会 */}
            <div className="mt-3">
              <span className="text-sm text-muted-foreground">组委会：</span>
              <div className="inline-flex flex-wrap gap-1 ml-1">
                {award.admins.map((admin, i) => (
                  <Badge key={i} variant="outline" className="font-normal text-xs">
                    {admin.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 申请按钮 */}
            <div className="mt-4">
              <Button asChild disabled={!hasOpenCycle}>
                <Link href={`/awards/application?awardId=${award.id}`}>
                  {hasOpenCycle ? "立即申请 / 提名" : "暂无开放申请"}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 当前开放周期提示 */}
        {openCycles.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
              <Clock className="h-4 w-4" />
              当前开放申请
            </div>
            <div className="flex flex-wrap gap-4">
              {openCycles.map((cycle) => (
                <div key={cycle.id} className="text-sm">
                  <span className="font-medium">{cycle.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 标签页内容 */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">基本信息</span>
            <span className="sm:hidden">信息</span>
          </TabsTrigger>
          <TabsTrigger value="criteria" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">评选标准</span>
            <span className="sm:hidden">标准</span>
          </TabsTrigger>
          <TabsTrigger value="intro" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">奖项介绍</span>
            <span className="sm:hidden">介绍</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <TrophyIcon className="h-4 w-4" />
            <span className="hidden sm:inline">结果公示</span>
            <span className="sm:hidden">结果</span>
          </TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="info" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 奖项设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  奖项设置
                </CardTitle>
              </CardHeader>
              <CardContent>
                {award.prizeLevels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {award.prizeLevels.map((level) => (
                      <Badge
                        key={level.id}
                        style={{ backgroundColor: level.color, color: '#fff' }}
                        className="px-3 py-1"
                      >
                        {level.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">暂无奖项等级设置</p>
                )}
              </CardContent>
            </Card>

            {/* 申请赛道 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  申请赛道
                </CardTitle>
              </CardHeader>
              <CardContent>
                {award.tracks.length > 0 ? (
                  <div className="space-y-3">
                    {award.tracks.map((track) => (
                      <div key={track.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{track.name}</span>
                          {track.journals && track.journals.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {track.journals.length} 个期刊
                            </Badge>
                          )}
                        </div>
                        {track.description && (
                          <p className="text-sm text-muted-foreground mt-1">{track.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">暂无赛道设置</p>
                )}
              </CardContent>
            </Card>

            {/* 历史周期 */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  历史周期
                </CardTitle>
              </CardHeader>
              <CardContent>
                {award.cycles.length > 0 ? (
                  <div className="space-y-2">
                    {award.cycles.map((cycle) => (
                      <div key={cycle.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="font-medium">{cycle.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                          </span>
                          {cycle.status === 'OPEN' ? (
                            <Badge className="bg-green-600">进行中</Badge>
                          ) : cycle.status === 'ANNOUNCED' ? (
                            <Badge className="bg-blue-600">已公示</Badge>
                          ) : cycle.status === 'CLOSED' ? (
                            <Badge variant="secondary">已结束</Badge>
                          ) : (
                            <Badge variant="outline">即将开始</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">暂无历史周期</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 评选标准 */}
        <TabsContent value="criteria" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                评选标准
              </CardTitle>
            </CardHeader>
            <CardContent>
              {award.criteria ? (
                <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {award.criteria}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">暂无评选标准说明</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 奖项介绍 */}
        <TabsContent value="intro" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                奖项介绍
              </CardTitle>
            </CardHeader>
            <CardContent>
              {award.description ? (
                <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {award.description}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">暂无奖项介绍</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 结果公示 */}
        <TabsContent value="results" className="mt-6">
          {sortedGroups.length > 0 ? (
            <div className="space-y-4">
              {sortedGroups.map((group) => (
                <Card key={group.levelName}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.levelColor }}
                      />
                      {group.levelName}
                      <Badge variant="outline">{group.applications.length} 人</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {group.applications.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-start justify-between p-4 bg-muted/30 rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-lg">
                              {app.nomineeName}
                              {app.nomineeType === 'JOURNAL' && app.journal && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({app.journal.name})
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {app.track?.name} · {app.cycle?.name}
                            </div>
                            {app.reviewComment && (
                              <div className="text-sm text-muted-foreground italic mt-2 bg-muted/50 p-2 rounded">
                                "{app.reviewComment}"
                              </div>
                            )}
                            {app.nominationPapers.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {app.nominationPapers.map((paper) => (
                                  <Link
                                    key={paper.id}
                                    href={`/novel/${paper.id}`}
                                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 bg-primary/10 px-2 py-1 rounded"
                                  >
                                    <FileText className="h-3 w-3" />
                                    {paper.title}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex-shrink-0">
                            {app.publishedAt?.toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>暂无已发布的评审结果</p>
                <p className="text-sm mt-1">评审结果将在发布后在显示</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
