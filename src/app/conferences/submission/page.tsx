
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CreateWorkForm } from "@/app/journals/submission/create-work-form"

export default async function ConferenceSubmissionPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user
  
  let rawJournals: { id: string, name: string }[] = []

  // Filter journals based on user role and login status
  // For conferences, we specifically look for journals with type='CONFERENCE'
  
  if (isLoggedIn && session.user.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        managedConference: { select: { id: true, name: true, status: true } },
        reviewerConferences: { select: { id: true, name: true, status: true } }
      }
    })

    if (user) {
      if (user.role === 'SUPER_ADMIN') {
         // SUPER_ADMIN: All active conferences
         rawJournals = await prisma.conference.findMany({
            where: { 
                status: 'ACTIVE',
            },
            select: { id: true, name: true }
         })
      } else if (user.role === 'ADMIN') {
         // ADMIN: Only managed conference
         const managedConference = user.managedConference
         if (managedConference && managedConference.status === 'ACTIVE') {
            rawJournals = [managedConference]
         }
      } else {
         // REVIEWER: Only reviewer conferences
         const reviewerConferences = user.reviewerConferences.filter(c => c.status === 'ACTIVE')
         
         if (reviewerConferences.length > 0) {
             rawJournals = reviewerConferences.map(c => ({ id: c.id, name: c.name }))
         }
      }
    }
  } else {
    // Guest: All active conferences
    rawJournals = await prisma.conference.findMany({
      where: { 
          status: 'ACTIVE',
      },
      select: { id: true, name: true }
    })
  }

  // Sort by name (supports Pinyin)
  const journals = rawJournals.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))

  // Fetch active Fund Applications (Approved projects)
  const fundApplications = await prisma.fundApplication.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, title: true, serialNo: true },
    orderBy: { createdAt: 'desc' }
  })

  // Reuse the existing CreateWorkForm component
  // It handles the submission logic to /app/journals/submission/actions.ts which is generic enough for both types
  return (
    <div className="container mx-auto py-8">
        <CreateWorkForm 
            journals={journals} 
            fundApplications={fundApplications} 
            isLoggedIn={isLoggedIn}
            mode="conference"
        />
    </div>
  )
}
