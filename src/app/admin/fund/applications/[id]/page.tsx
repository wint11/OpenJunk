import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, User, FileText, Clock } from "lucide-react"
import { ReviewDialog } from "./review-dialog"

export default async function FundApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect("/")
  }

  const application = await prisma.fundApplication.findUnique({
    where: { id },
    include: {
      fund: {
        include: {
          category: true
        }
      },
      reviews: {
        include: {
          expert: true
        }
      }
    }
  })

  if (!application) {
    return <div>申报书不存在</div>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">已立项</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">未立项</Badge>
      case 'SUBMITTED':
        return <Badge variant="secondary">已提交</Badge>
      case 'UNDER_REVIEW':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">评审中</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/fund/applications">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">申报详情</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="font-mono">{application.serialNo || '无编号'}</span>
            <span>•</span>
            <span>{getStatusBadge(application.status)}</span>
          </p>
        </div>
        <div className="ml-auto">
          {['SUBMITTED', 'UNDER_REVIEW'].includes(application.status) && (
            <ReviewDialog applicationId={application.id} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>项目信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">{application.title}</h3>
                <div className="text-sm text-muted-foreground mb-4">
                  所属基金：{application.fund.title} ({application.fund.category.name})
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">项目简介</h4>
                <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                  {application.description}
                </div>
              </div>

              {application.achievements && (
                <div>
                  <h4 className="font-medium mb-2">已有成果</h4>
                  <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                    {application.achievements}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review History */}
          <Card>
            <CardHeader>
              <CardTitle>评审记录</CardTitle>
            </CardHeader>
            <CardContent>
              {application.reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">暂无评审记录</div>
              ) : (
                <div className="space-y-4">
                  {application.reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {review.expert.realName || '评审专家'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(review.createdAt, 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>
                      <div className="flex gap-4 mb-2 text-sm">
                        <Badge variant={review.grade === 'A' ? 'default' : 'secondary'}>
                          评分: {review.score} ({review.grade})
                        </Badge>
                      </div>
                      <div className="text-sm bg-muted/50 p-3 rounded">
                        {review.comments || '无评审意见'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">申请人信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {application.applicantName[0]}
                </div>
                <div>
                  <div className="font-medium">{application.applicantName}</div>
                  <div className="text-xs text-muted-foreground">申请人</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">时间线</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                    <div className="w-0.5 flex-1 bg-border my-1" />
                  </div>
                  <div className="pb-4">
                    <div className="text-sm font-medium">提交申请</div>
                    <div className="text-xs text-muted-foreground">
                      {format(application.createdAt, 'yyyy-MM-dd HH:mm')}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-2 w-2 rounded-full mt-1.5 ${application.updatedAt > application.createdAt ? 'bg-primary' : 'bg-muted'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">最近更新</div>
                    <div className="text-xs text-muted-foreground">
                      {format(application.updatedAt, 'yyyy-MM-dd HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
