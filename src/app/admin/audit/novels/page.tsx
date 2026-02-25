import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { NovelAuditActions } from "./novel-audit-actions"

export default async function NovelAuditPage() {
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
    status: 'PENDING' 
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

  const novels = await prisma.novel.findMany({
    where: whereClause,
    orderBy: { lastSubmittedAt: 'desc' },
    include: { 
      uploader: true,
      journal: true
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">新论文审核</h1>
        <p className="text-muted-foreground">审核论文的基本信息（封面、摘要、标题等）</p>
      </div>
      
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>所属期刊</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>上传者</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>提交IP</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {novels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  暂无待审论文
                </TableCell>
              </TableRow>
            ) : (
              novels.map((novel) => (
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
                  <TableCell>{novel.uploader?.name || "匿名"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{novel.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {novel.uploaderIp || '未知'}
                  </TableCell>
                  <TableCell>
                    <NovelAuditActions 
                      novelId={novel.id} 
                      pdfUrl={novel.pdfUrl} 
                      title={novel.title}
                      author={novel.author}
                      description={novel.description}
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
