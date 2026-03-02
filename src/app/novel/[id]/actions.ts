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
  try {
    await calculateAoi(novelId)
    revalidatePath(`/novel/${novelId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to trigger AOI calculation:", error)
    return { success: false, error: "Failed to calculate AOI" }
  }
}
