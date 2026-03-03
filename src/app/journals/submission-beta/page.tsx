
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { GuestSubmissionWizard } from "./components/guest-wizard"
import { UserSubmissionWizard } from "./components/user-wizard"
import { AlertCircle } from "lucide-react"

export default async function SubmissionPage() {
  const session = await auth()
  const user = session?.user

  // 1. Guest Logic
  if (!user) {
    return <GuestSubmissionWizard />
  }

  // 2. Logged-in User Logic (Direct Publish)
  // Fetch user permissions and available journals
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      managedJournal: { select: { id: true, name: true, status: true } },
      reviewerJournals: { select: { id: true, name: true, status: true } }
    }
  })

  let availableJournals: { id: string, name: string }[] = []

  if (dbUser) {
    if (dbUser.role === 'SUPER_ADMIN') {
        availableJournals = await prisma.journal.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        })
    } else if (dbUser.role === 'ADMIN') {
        if (dbUser.managedJournal && dbUser.managedJournal.status === 'ACTIVE') {
            availableJournals = [dbUser.managedJournal]
        }
    } else {
        // Reviewers or others
        const activeReviewerJournals = dbUser.reviewerJournals.filter(j => j.status === 'ACTIVE')
        availableJournals = activeReviewerJournals.map(j => ({ id: j.id, name: j.name }))
    }
  }

  if (availableJournals.length === 0) {
    return (
        <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
            <div className="bg-destructive/10 text-destructive p-8 rounded-lg inline-flex flex-col items-center">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-bold mb-2">无发布权限</h2>
                <p>您的账号暂无管理或参与的活跃期刊，无法进行快速发布。</p>
            </div>
        </div>
    )
  }

  return <UserSubmissionWizard availableJournals={availableJournals} />
}
