import { prisma } from "@/lib/prisma"
import UniverseClient from "@/components/universe/universe-client"

export const metadata = {
  title: "期刊宇宙 | SmartReview",
  description: "探索期刊星系，发现学术新大陆",
}

export default async function UniversePage() {
  // 1. Get current active season
  const currentSeason = await prisma.universeSeason.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" }
  })

  // If no season exists, create one
  let seasonId = currentSeason?.id
  let seasonName = currentSeason?.name || "S0: 启航"
  
  if (!currentSeason) {
    const newSeason = await prisma.universeSeason.create({
      data: {
        name: "S1: 智慧起源",
        startDate: new Date(),
        isActive: true
      }
    })
    seasonId = newSeason.id
    seasonName = newSeason.name
  }

  // 2. Fetch journals with combat power
  const journals = await prisma.journal.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      description: true,
      combatPower: true, // Fetch real combat power
      _count: {
        select: { papers: true },
      },
    },
    orderBy: {
      name: "asc", 
    },
  })

  // Calculate total popularity for visual effects (brightness)
  const journalsWithPopularity = await Promise.all(journals.map(async (journal) => {
    const aggregate = await prisma.novel.aggregate({
      where: {
        journalId: journal.id,
        status: "PUBLISHED",
      },
      _sum: {
        popularity: true,
      },
    })
    
    // Also fetch season contribution if needed, but for now global combat power is fine
    return {
      ...journal,
      totalPopularity: aggregate._sum.popularity || 0,
    }
  }))

  // Format data for the 3D scene
  const formattedJournals = journalsWithPopularity.map((journal) => ({
    id: journal.id,
    name: journal.name,
    description: journal.description,
    paperCount: journal._count.papers,
    totalPopularity: journal.totalPopularity,
    combatPower: journal.combatPower, // Pass combat power to client
  }))

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black z-50">
      <UniverseClient 
        journals={formattedJournals} 
        currentSeason={{ id: seasonId!, name: seasonName }}
      />
    </div>
  )
}
