import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, ArrowLeft, Clock, FileText, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function FundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fund = await prisma.fund.findUnique({
    where: { id },
    include: { category: true }
  })

  if (!fund) {
    notFound()
  }

  const isExpired = new Date() > new Date(fund.endDate)
  const isStarted = new Date() >= new Date(fund.startDate)
  const canApply = isStarted && !isExpired && fund.status === "ACTIVE"

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 sm:px-6">
      <Button variant="ghost" asChild className="mb-8 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors">
        <Link href="/fund" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回基金列表
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left Content: Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 text-sm">
                {fund.category.name}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                {fund.year}年度
              </Badge>
              {isExpired && <Badge variant="destructive">已截止</Badge>}
              {!isStarted && <Badge variant="secondary">未开始</Badge>}
              {canApply && <Badge variant="default" className="bg-green-600 hover:bg-green-700">申报中</Badge>}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              {fund.title}
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-muted/50">
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium mr-2">开始日期:</span>
                {format(new Date(fund.startDate), 'yyyy-MM-dd')}
              </div>
              <div className="hidden sm:block w-px h-4 bg-border self-center" />
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium mr-2">截止日期:</span>
                {format(new Date(fund.endDate), 'yyyy-MM-dd')}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center">
              <FileText className="mr-2 h-6 w-6 text-primary" />
              申报指南
            </h2>
            <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary hover:prose-a:underline bg-card p-6 rounded-xl border shadow-sm">
              <div className="whitespace-pre-wrap leading-relaxed">
                {fund.guideContent || "暂无详细指南内容。"}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar: Action Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="shadow-lg border-muted/60 overflow-hidden">
              <div className="h-2 bg-primary w-full" />
              <CardHeader>
                <CardTitle className="text-xl">申报操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2 mb-4">
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span className="text-muted-foreground">无需登录，直接填报</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span className="text-muted-foreground">系统自动生成唯一编号</span>
                  </div>
                </div>

                {canApply ? (
                  <Button size="lg" className="w-full font-bold shadow-md hover:shadow-lg transition-all" asChild>
                    <Link href={`/fund/apply/${fund.id}`}>
                      立即申请
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" className="w-full" disabled variant="secondary">
                    {isExpired ? "申报已截止" : "申报未开始"}
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground text-center pt-2">
                  如有疑问，请联系基金管理部门
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
