import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Eye, FileClock, Wallet, FileText, CheckSquare, UserCog } from "lucide-react"
import { getAiReviewEnabled, setAiReviewEnabled } from "@/lib/app-settings"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default async function AdminDashboardPage() {
  const session = await auth()
  const role = session?.user?.role ?? ""
  
  let isFundAdmin = false
  if (role === 'ADMIN' && session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { fundAdminCategories: true }
    })
    isFundAdmin = (user?.fundAdminCategories.length ?? 0) > 0
  }

  const aiReviewEnabled = role === "SUPER_ADMIN" ? await getAiReviewEnabled() : false

  // Stats Logic
  let stats: { title: string; value: number; icon: any }[] = []
  let dashboardTitle = "管理概览"

  if (role === "SUPER_ADMIN") {
    dashboardTitle = "系统后台概览"
    const totalUsers = await prisma.user.count()
    const totalJournals = await prisma.journal.count()
    const totalFunds = await prisma.fund.count()
    const totalExperts = await prisma.fundExpertProfile.count()

    stats = [
      { title: "注册用户", value: totalUsers, icon: Users },
      { title: "期刊总数", value: totalJournals, icon: BookOpen },
      { title: "基金项目", value: totalFunds, icon: Wallet },
      { title: "专家库", value: totalExperts, icon: UserCog },
    ]
  } else if (isFundAdmin) {
    dashboardTitle = "基金管理概览"
    // For Fund Admin, we might want to filter by their categories in a real app,
    // but for now showing global stats is acceptable or we can filter.
    // Let's keep it simple global for MVP unless specified otherwise.
    const totalFunds = await prisma.fund.count()
    const totalApplications = await prisma.fundApplication.count()
    const pendingReviews = await prisma.fundReview.count({ where: { status: 'PENDING' } })
    const activeExperts = await prisma.fundExpertProfile.count({ where: { isActive: true } })

    stats = [
      { title: "基金项目", value: totalFunds, icon: Wallet },
      { title: "申报总数", value: totalApplications, icon: FileText },
      { title: "待评审", value: pendingReviews, icon: CheckSquare },
      { title: "入库专家", value: activeExperts, icon: UserCog },
    ]
  } else {
    // Journal Admin (Default) or Reviewer
    dashboardTitle = "期刊管理概览"
    
    // Determine the scope
    let journalIds: string[] = []
    
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { 
            reviewerJournals: true 
        }
    })

    if (role === 'ADMIN' && currentUser?.managedJournalId) {
        journalIds.push(currentUser.managedJournalId)
    }
    
    // If user is a reviewer (or admin acting as reviewer), add assigned journals
    // Note: Admin might not be in reviewerJournals list of their own journal usually, but if they are, it's fine.
    if (currentUser?.reviewerJournals) {
        journalIds.push(...currentUser.reviewerJournals.map(j => j.id))
    }
    
    // Deduplicate
    journalIds = Array.from(new Set(journalIds))
    
    const whereClause: any = journalIds.length > 0 ? { journalId: { in: journalIds } } : { journalId: "NONE" }

    const totalArticles = await prisma.novel.count({ where: whereClause })
    const pendingArticles = await prisma.novel.count({ where: { ...whereClause, status: 'PENDING' } })
    // Only count views for these journals
    const totalViews = await prisma.novel.aggregate({ 
        _sum: { views: true },
        where: whereClause
    })
    
    // Count reviewers for these journals? Or just hide User count.
    // Let's show "My Reviewers" if Admin, or just hide it.
    // User requested "only see their own data". Global user count is definitely wrong.
    // Let's replace "Total Users" with "Published Articles" count for this journal
    const publishedArticles = await prisma.novel.count({ where: { ...whereClause, status: 'PUBLISHED' } })

    stats = [
      { title: "总收稿量", value: totalArticles, icon: BookOpen },
      { title: "待审稿", value: pendingArticles, icon: FileClock },
      { title: "已发表", value: publishedArticles, icon: CheckSquare },
      { title: "总浏览量", value: totalViews._sum.views || 0, icon: Eye },
    ]
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{dashboardTitle}</h1>
      
      {role === "SUPER_ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">系统功能</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData: FormData) => {
                "use server"
                const session = await auth()
                if (session?.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized")
                const enabled = formData.get("aiReviewEnabled") === "on"
                await setAiReviewEnabled(enabled)
                revalidatePath("/admin")
                revalidatePath("/admin/articles")
              }}
              className="flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <Label htmlFor="aiReviewEnabled">稿件 AI 预审</Label>
                <p className="text-sm text-muted-foreground">开启后，作者首次投稿会触发 AI 预审</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="aiReviewEnabled"
                  name="aiReviewEnabled"
                  type="checkbox"
                  defaultChecked={aiReviewEnabled}
                  className="h-4 w-4"
                />
                <Button type="submit" size="sm" variant="outline">
                  保存
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
