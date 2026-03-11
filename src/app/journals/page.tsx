import { prisma } from "@/lib/prisma"
import { JournalsList } from "./JournalsList"

export const metadata = {
  title: "期刊列表",
  description: "浏览OpenJunk旗下的所有垃圾期刊",
}

export default async function JournalsPage() {
  const journals = await prisma.journal.findMany({
    where: { status: 'ACTIVE' },
    include: {
      _count: {
        select: { admins: true, reviewers: true }
      }
    },
  })

  // Fetch published paper counts manually for accuracy
  const journalsWithCounts = await Promise.all(journals.map(async (j) => {
    const paperCount = await prisma.novel.count({
      where: {
        journalId: j.id,
        status: 'PUBLISHED'
      }
    })
    return {
      ...j,
      publishedPaperCount: paperCount
    }
  }))

  // Serialize dates to ISO strings for client component
  const serializedJournals = journalsWithCounts.map(j => ({
    ...j,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
  }))

  return <JournalsList journals={serializedJournals} />
}
