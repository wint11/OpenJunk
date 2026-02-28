import { prisma } from "@/lib/prisma"
import { SplashTrashDeck } from "@/components/home/splash-trash-deck"
import { getRecommendedPapers } from "@/lib/recommendation"

// Force dynamic rendering so that we get fresh recommendations on every request
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch recommended papers using our weighted algorithm
  const featuredPapers = await getRecommendedPapers(12)

  return (
    <div className="flex flex-col flex-1 h-full bg-background overflow-hidden relative">
      <SplashTrashDeck papers={featuredPapers} />
    </div>
  )
}
