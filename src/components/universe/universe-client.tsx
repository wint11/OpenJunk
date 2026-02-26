"use client"

import dynamic from "next/dynamic"

// Dynamic import with SSR disabled must be in a Client Component or used properly
const UniverseScene = dynamic(() => import("@/components/universe/universe-scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black text-white/50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
        <p className="text-sm">正在加载期刊星系...</p>
      </div>
    </div>
  ),
})

interface Journal {
  id: string
  name: string
  paperCount: number
  description?: string | null
  totalPopularity: number
  combatPower: number
}

interface UniverseClientProps {
  journals: Journal[]
  currentSeason: {
    id: string
    name: string
  }
}

export default function UniverseClient({ journals, currentSeason }: UniverseClientProps) {
  return <UniverseScene journals={journals} currentSeason={currentSeason} />
}
