import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import { NovelActions } from "./novel-actions"

export default async function PublishedNovelsPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""

  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    redirect("/")
  }

  // Get current user to check for managedJournalId
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { managedJournalId: true }
  })

  const whereClause: any = { 
    status: { in: ['PUBLISHED', 'TAKEDOWN'] }
  }

  // If ADMIN (and not SUPER_ADMIN), restrict to managed journal
  if (role === 'ADMIN') {
    if (currentUser?.managedJournalId) {
      whereClause.journalId = currentUser.managedJournalId
    } else {
      // Admin with no journal sees nothing
      whereClause.journalId = "NO_ACCESS"
    }
  }

  const novels = await prisma.novel.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    include: { 
      uploader: true,
      journal: true
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">已录用稿件管理</h1>
        <p className="text-muted-foreground">管理已录用的稿件，支持撤稿和设为精选</p>
      </div>
      
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">标题</TableHead>
              <TableHead className="w-[150px]">所属期刊</TableHead>
              <TableHead className="w-[100px]">作者</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[100px]">首页推荐</TableHead>
              <TableHead className="w-[120px]">更新时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {novels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  暂无已录用稿件
                </TableCell>
              </TableRow>
            ) : (
              novels.map((novel) => (
                <TableRow key={novel.id}>
                  <TableCell className="font-medium">
                    <div className="max-w-[300px] truncate" title={novel.title}>
                        {novel.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    {novel.journal ? (
                       <Badge variant="outline" className="max-w-[150px] truncate" title={novel.journal.name}>{novel.journal.name}</Badge>
                    ) : (
                       <span className="text-muted-foreground text-sm">无期刊</span>
                    )}
                  </TableCell>
                  <TableCell>
                      <div className="max-w-[100px] truncate" title={novel.author}>
                          {novel.author}
                      </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={novel.status === 'PUBLISHED' ? 'default' : 'destructive'}>
                      {novel.status === 'PUBLISHED' ? '已发布' : '已下架'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {novel.isRecommended ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" /> 推荐中
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[120px] truncate" title={new Date(novel.updatedAt).toLocaleDateString()}>
                        {new Date(novel.updatedAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <NovelActions 
                      id={novel.id} 
                      status={novel.status} 
                      isRecommended={novel.isRecommended} 
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
