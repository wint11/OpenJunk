import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye } from "lucide-react"

export default async function ChapterAuditPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""

  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(role)) {
    redirect("/")
  }

  // Get current user to check for managedJournalId and reviewerJournals
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { 
      managedJournal: true,
      reviewerJournals: true
    }
  })

  const whereClause: any = {
    chapters: {
      some: {
        status: 'PENDING'
      }
    }
  }

  // If ADMIN (and not SUPER_ADMIN), restrict to managed journal
  if (role === 'ADMIN') {
    if (currentUser?.managedJournalId) {
      whereClause.journalId = currentUser.managedJournalId
    } else {
      // Admin with no journal sees nothing
      whereClause.journalId = "NO_ACCESS"
    }
  } else if (role === 'REVIEWER') {
    // Reviewer can only see papers in their assigned journals
    const journalIds = currentUser?.reviewerJournals.map(j => j.id) || []
    if (journalIds.length > 0) {
       whereClause.journalId = { in: journalIds }
    } else {
       whereClause.journalId = "NO_ACCESS"
    }
  }

  // Find novels that have pending chapters
  // Note: Since we don't have a direct "hasPendingChapters" field on Novel easily queryable without groupBy,
  // we can query novels where chapters some status is PENDING.
  const novelsWithPendingChapters = await prisma.novel.findMany({
    where: whereClause,
    include: {
      _count: {
        select: { 
            chapters: { where: { status: 'PENDING' } } 
        }
      },
      uploader: true,
      journal: true
    },
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">内容修订审核</h1>
        <p className="text-muted-foreground">审核新上传的论文内容</p>
      </div>
      
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>论文标题</TableHead>
              <TableHead>所属期刊</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>上传者</TableHead>
              <TableHead>待审核内容数</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {novelsWithPendingChapters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  暂无待审内容
                </TableCell>
              </TableRow>
            ) : (
              novelsWithPendingChapters.map((novel) => (
                <TableRow key={novel.id}>
                  <TableCell className="font-medium">{novel.title}</TableCell>
                  <TableCell>
                    {novel.journal ? (
                       <Badge variant="outline">{novel.journal.name}</Badge>
                    ) : (
                       <span className="text-muted-foreground text-sm">无期刊</span>
                    )}
                  </TableCell>
                  <TableCell>{novel.author}</TableCell>
                  <TableCell>{novel.uploader?.name || "未知"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{novel._count.chapters}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(novel.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" asChild>
                      <Link href={`/admin/audit/chapters/${novel.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        审核内容
                      </Link>
                    </Button>
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
