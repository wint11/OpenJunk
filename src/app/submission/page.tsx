import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CreateWorkForm } from "./create-work-form"

export default async function NewWorkPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user
  
  let rawJournals: { id: string, name: string }[] = []

  if (isLoggedIn && session.user.id) {
    // If logged in:
    // 1. SUPER_ADMIN: Can submit to ALL active journals
    // 2. ADMIN (Editor-in-Chief): Only managed journal
    // 3. REVIEWER (Editor): Only reviewer journals
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        managedJournal: { select: { id: true, name: true, status: true } },
        reviewerJournals: { select: { id: true, name: true, status: true } }
      }
    })

    if (user) {
      if (user.role === 'SUPER_ADMIN') {
         // Fetch ALL active journals for SUPER_ADMIN
         rawJournals = await prisma.journal.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true }
         })
      } else if (user.role === 'ADMIN') {
         // For ADMIN (Editor-in-Chief), only their managed journal
         const managedJournal = user.managedJournal
         if (managedJournal && managedJournal.status === 'ACTIVE') {
            rawJournals = [managedJournal]
         }
      } else {
         // For REVIEWER (Editor), only their reviewer journals
         // Note: Assuming 'REVIEWER' role or any other role falls here
         const reviewerJournals = user.reviewerJournals
         
         const journalMap = new Map<string, { id: string, name: string }>()
         
         reviewerJournals.forEach(j => {
           if (j.status === 'ACTIVE') {
             journalMap.set(j.id, j)
           }
         })
         
         rawJournals = Array.from(journalMap.values())
      }
    }
  } else {
    // If not logged in (Guest), fetch ALL active journals
    rawJournals = await prisma.journal.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true }
    })
  }

  // Sort journals alphabetically by name (supports Pinyin)
  const journals = rawJournals.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))

  // Fetch active Fund Applications (Approved projects)
  // These are specific projects, not general funds.
  // We should list APPROVED applications. 
  // Maybe filter by user if logged in? Or just list all if it's public?
  // User requirement: "支持选择当前已经公开的基金项目" -> public approved projects.
  const fundApplications = await prisma.fundApplication.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, title: true, serialNo: true },
    orderBy: { createdAt: 'desc' }
  })

  return <CreateWorkForm journals={journals} fundApplications={fundApplications} isLoggedIn={isLoggedIn} />
}
