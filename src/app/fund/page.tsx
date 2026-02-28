import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, FileText, ArrowRight } from "lucide-react"
import { format } from "date-fns"

export default async function FundPage() {
  const funds = await prisma.fund.findMany({
    where: {
      status: "ACTIVE"
    },
    include: {
      category: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 sm:px-6">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">基金申报</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          查看最新的科研基金申报指南，并在线提交申请。
        </p>
      </div>

      {funds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-xl bg-muted/5 text-center">
          <div className="bg-muted/20 p-4 rounded-full mb-4">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">暂无开放申请的基金</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            当前没有正在进行的基金申报项目。请稍后关注最新的申报通知，或订阅我们的动态。
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {funds.map((fund) => (
            <Card key={fund.id} className="flex flex-col h-full hover:shadow-xl transition-all duration-300 border-muted/60">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    {fund.category.name}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs">
                    {fund.year}年度
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2 text-xl font-bold leading-tight min-h-[3.5rem]">
                  {fund.title}
                </CardTitle>
                <CardDescription className="flex items-center mt-2 text-sm font-medium">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">截止: </span>
                  <span className="ml-1 text-foreground">{format(new Date(fund.endDate), 'yyyy-MM-dd')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-6">
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {fund.guideContent ? fund.guideContent.substring(0, 100).replace(/[#*`]/g, '') + "..." : "暂无简介"}
                </p>
              </CardContent>
              <CardFooter className="pt-0 gap-3">
                 <Button asChild variant="outline" className="flex-1 group">
                  <Link href={`/fund/${fund.id}`}>
                    查看指南
                  </Link>
                </Button>
                <Button asChild className="flex-1 shadow-sm">
                  <Link href={`/fund/apply/${fund.id}`}>
                    立即申请 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
