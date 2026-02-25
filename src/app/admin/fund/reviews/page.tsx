import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function FundReviewsPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect("/")
  }

  const reviews = await prisma.fundReview.findMany({
    include: {
      application: {
        include: {
          fund: true
        }
      },
      expert: {
        include: {
          user: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">评审管理</h1>
          <p className="text-muted-foreground">查看专家评审记录</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>评审记录列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申报项目</TableHead>
                <TableHead>所属基金</TableHead>
                <TableHead>评审专家</TableHead>
                <TableHead>评分</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>评审意见</TableHead>
                <TableHead>时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    暂无评审数据
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.application.title}</TableCell>
                    <TableCell>{review.application.fund.title}</TableCell>
                    <TableCell>{review.expert.user.name || review.expert.realName || 'Unknown'}</TableCell>
                    <TableCell>{review.score || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={review.grade === 'A' ? 'default' : 'secondary'}>
                        {review.grade || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={review.comments || ''}>
                      {review.comments || '-'}
                    </TableCell>
                    <TableCell>{format(review.createdAt, 'yyyy-MM-dd HH:mm')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
