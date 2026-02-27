
import { prisma } from "@/lib/prisma"
import { ApplicationForm } from "./application-form"

interface PageProps {
  searchParams: Promise<{ awardId?: string }>
}

export default async function AwardApplicationPage({ searchParams }: PageProps) {
  const { awardId } = await searchParams
  
  const awards = await prisma.award.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true }
  })

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">申请奖项</h1>
        <p className="text-muted-foreground mt-2">
          提名你自己或他人，角逐OpenJunk至高无上的垃圾荣誉。
        </p>
      </div>
      
      <ApplicationForm awards={awards} defaultAwardId={awardId} />
    </div>
  )
}
