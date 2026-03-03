import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { NovelAuditActions } from "./novel-audit-actions"
import { RefreshCw } from "lucide-react"

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

  // For ADMIN/REVIEWER, restrict to their journals.
  // SUPER_ADMIN sees all.
  let whereClause: any = { 
    status: 'DRAFT' 
  }

  // Update logic for multi-submission:
  // A novel can be pending for multiple journals.
  // We need to check if the novel's submissionTargets overlap with the user's managed journals.
  
  if (role !== 'SUPER_ADMIN') {
      let allowedJournalIds: string[] = []
      
      if (role === 'ADMIN' && currentUser?.managedJournalId) {
          allowedJournalIds = [currentUser.managedJournalId]
      }
      // Allow admins to also see journals they review if any
      if (currentUser?.reviewerJournals?.length) {
          const reviewerIds = currentUser.reviewerJournals.map(j => j.id)
          allowedJournalIds = [...allowedJournalIds, ...reviewerIds]
      }
      
      // Deduplicate ids
      allowedJournalIds = Array.from(new Set(allowedJournalIds))
      
      if (allowedJournalIds.length > 0) {
          whereClause = {
            AND: [
                { status: 'DRAFT' },
                {
                    OR: [
                        {
                            submissionTargets: {
                                some: {
                                    id: { in: allowedJournalIds }
                                }
                            }
                        },
                        {
                            journalId: { in: allowedJournalIds }
                        }
                    ]
                }
            ]
          }
      } else {
          // No access if no journals assigned
          whereClause = { id: "NO_ACCESS" }
      }
  }

  const novels = await prisma.novel.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }, // Changed to createdAt as lastSubmittedAt might be null
    include: { 
      uploader: true,
      journal: true,
      submissionTargets: true, // Include targets to show which journals it was submitted to
      fundApplications: true
    }
  })

  // Fetch all approved fund applications for editing
  const fundApplications = await prisma.fundApplication.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, title: true, serialNo: true }
  })

  // Get available journals for the current user to publish to
  let availableJournals: { id: string, name: string }[] = []
  
  if (role === 'SUPER_ADMIN') {
      // Super admin can publish to any journal
      const allJournals = await prisma.journal.findMany({
          select: { id: true, name: true }
      })
      availableJournals = allJournals
  } else {
      if (currentUser?.managedJournal) {
          availableJournals.push({ id: currentUser.managedJournal.id, name: currentUser.managedJournal.name })
      }
      if (currentUser?.reviewerJournals) {
          // Add reviewer journals if not already added
          currentUser.reviewerJournals.forEach(j => {
              if (!availableJournals.find(aj => aj.id === j.id)) {
                  availableJournals.push({ id: j.id, name: j.name })
              }
          })
      }
  }

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
              <TableHead className="w-[300px]">标题</TableHead>
              <TableHead className="w-[150px]">所属期刊</TableHead>
              <TableHead className="w-[100px]">作者</TableHead>
              <TableHead className="w-[100px]">上传者</TableHead>
              <TableHead className="w-[100px]">分类</TableHead>
              <TableHead className="w-[120px]">提交IP</TableHead>
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
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2 max-w-[300px]">
                        <div className="truncate" title={novel.title}>
                            {novel.title}
                        </div>
                        {/* New Version Badge */}
                        {novel.lastSubmittedAt && novel.lastSubmittedAt > novel.createdAt && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200" title="作者已提交新版本">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                新版本
                            </Badge>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {novel.journal ? (
                       <Badge variant="outline" className="max-w-[150px] truncate" title={novel.journal.name}>{novel.journal.name}</Badge>
                    ) : (
                       <div className="flex flex-wrap gap-1 max-w-[150px] overflow-hidden" title={novel.submissionTargets.map(t => t.name).join(", ")}>
                         {novel.submissionTargets.length > 0 ? (
                           novel.submissionTargets.map(t => (
                             <Badge key={t.id} variant="secondary" className="text-xs truncate max-w-[140px]">{t.name}</Badge>
                           ))
                         ) : (
                           <span className="text-muted-foreground text-sm">无期刊</span>
                         )}
                       </div>
                    )}
                    {novel.submissionTargets.length > 1 && !novel.journal && (
                        <span className="ml-2 text-xs text-orange-500 font-bold border border-orange-200 bg-orange-50 px-1 rounded">一稿多投</span>
                    )}
                  </TableCell>
                  <TableCell>
                      <div className="max-w-[100px] truncate" title={novel.author}>
                          {novel.author}
                      </div>
                  </TableCell>
                  <TableCell>
                      <div className="max-w-[100px] truncate" title={novel.uploader?.name || "匿名"}>
                          {novel.uploader?.name || "匿名"}
                      </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="max-w-[100px] truncate" title={novel.category}>{novel.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[120px] truncate" title={novel.uploaderIp || '未知'}>
                        {novel.uploaderIp || '未知'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <NovelAuditActions 
                        novel={novel} 
                        fundApplications={fundApplications}
                        availableJournals={availableJournals}
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
