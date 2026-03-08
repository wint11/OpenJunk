import { prisma } from "@/lib/prisma"
import { ApplicationForm } from "./application-form"

interface PageProps {
  searchParams: Promise<{ awardId?: string }>
}

export default async function AwardApplicationPage({ searchParams }: PageProps) {
  const { awardId } = await searchParams
  
  const awards = await prisma.award.findMany({
    where: { status: 'ACTIVE' },
    include: {
      cycles: {
        where: {
          status: { in: ['OPEN', 'UPCOMING'] }
        },
        orderBy: { startDate: 'desc' }
      },
      tracks: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // 获取所有期刊
  const journals = await prisma.journal.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">申请奖项</h1>
        <p className="text-muted-foreground mt-2">
          提名你自己或他人，角逐OpenJunk至高无上的垃圾荣誉。
        </p>
      </div>
      
      <ApplicationForm 
        awards={awards} 
        journals={journals}
        defaultAwardId={awardId} 
      />
    </div>
  )
}
