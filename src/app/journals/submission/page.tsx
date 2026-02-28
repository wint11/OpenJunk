import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CreateWorkForm } from "./create-work-form"

export default async function NewWorkPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user
  
  let rawJournals: { id: string, name: string }[] = []

  // Filter journals based on user role and login status
  // 1. If not logged in: Can submit to ALL active journals.
  // 2. If logged in (Fast Track):
  //    - ADMIN (Editor): Can ONLY submit to their managed journal.
  //    - REVIEWER (Editor): Can ONLY submit to their reviewer journals.
  //    - SUPER_ADMIN: Can submit to ALL active journals.
  
  if (isLoggedIn && session.user.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        managedJournal: { select: { id: true, name: true, status: true } },
        reviewerJournals: { select: { id: true, name: true, status: true } }
      }
    })

    if (user) {
      if (user.role === 'SUPER_ADMIN') {
         // SUPER_ADMIN: All active journals
         rawJournals = await prisma.journal.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true }
         })
      } else if (user.role === 'ADMIN') {
         // ADMIN: Only managed journal
         const managedJournal = user.managedJournal
         if (managedJournal && managedJournal.status === 'ACTIVE') {
            rawJournals = [managedJournal]
         }
      } else {
         // REVIEWER: Only reviewer journals
         // Note: Assuming 'REVIEWER' role or any other role falls here
         // Filter to only active journals
         const reviewerJournals = user.reviewerJournals.filter(j => j.status === 'ACTIVE')
         
         if (reviewerJournals.length > 0) {
             rawJournals = reviewerJournals.map(j => ({ id: j.id, name: j.name }))
         }
      }
    }
  } else {
    // Guest: All active journals
    rawJournals = await prisma.journal.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true }
    })
  }

  // Sort journals alphabetically by name (supports Pinyin)
  const journals = rawJournals.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))

  // Fetch active Fund Applications (Approved projects)
  const fundApplications = await prisma.fundApplication.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, title: true, projectNo: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <CreateWorkForm 
        journals={journals} 
        fundApplications={fundApplications} 
        isLoggedIn={isLoggedIn}
      />
    </div>
  )
}
