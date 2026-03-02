'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { calculateAoi } from "@/lib/aoi-calculator"

/**
 * Vote for AOI (Academic Overreach Index)
 * @param novelId The ID of the novel
 * @param voteType 'OVERREACH' (学术过端) or 'MISCONDUCT' (学术不端)
 */
export async function voteAoi(novelId: string, voteType: 'OVERREACH' | 'MISCONDUCT') {
  const session = await auth()
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || "127.0.0.1"
  
  // Check if user or IP has already voted
  // Requirement: "Every IP can vote once, and can change vote"
  // So we use upsert based on (novelId, ip)
  
  try {
    // 1. Record the vote
    await prisma.aoiVote.upsert({
      where: {
        novelId_ip: {
          novelId,
          ip
        }
      },
      update: {
        voteType,
        userId: session?.user?.id
      },
      create: {
        novelId,
        ip,
        voteType,
        userId: session?.user?.id
      }
    })

    // 2. Recalculate AOI Score
    // This will update the Novel record with new score
    await calculateAoi(novelId)

    // 3. Revalidate page
    revalidatePath(`/novel/${novelId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Failed to vote AOI:", error)
    return { success: false, error: "Failed to record vote" }
  }
}

/**
 * Trigger AI Calculation manually (e.g. if it failed or wasn't run)
 */
export async function triggerAoiCalculation(novelId: string) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  // Check if already calculated or processing
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { aiRigor: true }
  })

  if (!novel) return { success: false, error: "Novel not found" }

  // If aiRigor is not 0 (meaning it's either >0 for success, or -1 for failed/processing)
  // we strictly prevent re-triggering.
  if (novel.aiRigor !== 0) {
    return { success: false, error: "AI 评分已执行，无法重复触发" }
  }

  try {
    await calculateAoi(novelId)
    revalidatePath(`/novel/${novelId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to trigger AOI calculation:", error)
    return { success: false, error: "Failed to calculate AOI" }
  }
}
