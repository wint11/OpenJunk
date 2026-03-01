import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ConferenceAuditActions } from "./conference-audit-actions"

export default async function ConferenceAuditPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""

  if (!['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(role)) {
    redirect("/")
  }

  // Get current user to check for managedConference and reviewerConferences
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { 
      managedConference: true,
      reviewerConferences: true
    }
  })

  // For ADMIN/REVIEWER, restrict to their conferences.
  // SUPER_ADMIN sees all.
  let whereClause: any = { 
    status: 'DRAFT',
    // Currently assuming conference papers MUST have conferenceId set.
    // If submission logic allows conference papers to be "DRAFT" with conferenceId set.
    conferenceId: { not: null } 
  }

  if (role !== 'SUPER_ADMIN') {
      let allowedConferenceIds: string[] = []
      
      // Assuming 'ADMIN' can also manage conferences if assigned
      if (currentUser?.managedConferenceId) {
          allowedConferenceIds.push(currentUser.managedConferenceId)
      }
      
      if (currentUser?.reviewerConferences?.length) {
          const reviewerIds = currentUser.reviewerConferences.map(c => c.id)
          allowedConferenceIds = [...allowedConferenceIds, ...reviewerIds]
      }
      
      // Deduplicate
      allowedConferenceIds = Array.from(new Set(allowedConferenceIds))
      
      if (allowedConferenceIds.length > 0) {
          whereClause = {
            AND: [
                { status: 'DRAFT' },
                { conferenceId: { in: allowedConferenceIds } }
            ]
          }
      } else {
          // No access if no conferences assigned
          whereClause = { id: "NO_ACCESS" }
      }
  }

  const novels = await prisma.novel.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: { 
      uploader: true,
      conference: true, // Show conference info
      fundApplications: true
    }
  })

  // Fetch approved fund applications
  const fundApplications = await prisma.fundApplication.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, title: true, serialNo: true }
  })

  // Get available conferences for the current user
  let availableConferences: { id: string, name: string }[] = []
  
  if (role === 'SUPER_ADMIN') {
      const allConferences = await prisma.conference.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, name: true }
      })
      availableConferences = allConferences
  } else {
      if (currentUser?.managedConference) {
          availableConferences.push({ id: currentUser.managedConference.id, name: currentUser.managedConference.name })
      }
      if (currentUser?.reviewerConferences) {
          currentUser.reviewerConferences.forEach(c => {
              if (!availableConferences.find(ac => ac.id === c.id)) {
                  availableConferences.push({ id: c.id, name: c.name })
              }
          })
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">会议论文审核</h1>
        <p className="text-muted-foreground">审核会议投稿论文（封面、摘要、标题等）</p>
      </div>
      
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>所属会议</TableHead>
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
                  暂无待审会议论文
                </TableCell>
              </TableRow>
            ) : (
              novels.map((novel) => (
                <TableRow key={novel.id}>
                  <TableCell className="font-medium">{novel.title}</TableCell>
                  <TableCell>
                    {novel.conference ? (
                       <Badge variant="outline">{novel.conference.name}</Badge>
                    ) : (
                       <span className="text-muted-foreground text-sm">未知会议</span>
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
                    <ConferenceAuditActions 
                        novel={novel} 
                        fundApplications={fundApplications}
                        availableConferences={availableConferences}
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
