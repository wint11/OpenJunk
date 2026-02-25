'use server'

import { prisma } from "@/lib/prisma"

// Weights for different actions
const POPULARITY_WEIGHTS = {
  VIEW: 1,
  DOWNLOAD: 5,
  COMMENT: 10,
  BOOKSHELF: 8
}

type ActionType = keyof typeof POPULARITY_WEIGHTS

export async function incrementPopularity(novelId: string, action: ActionType) {
  try {
    const weight = POPULARITY_WEIGHTS[action]
    
    // Use updateMany to avoid updating the `updatedAt` field automatically
    await prisma.novel.updateMany({
      where: { id: novelId },
      data: {
        popularity: { increment: weight },
        views: action === 'VIEW' ? { increment: 1 } : undefined
      }
    })
  } catch (error) {
    console.error(`Failed to increment popularity for novel ${novelId}:`, error)
  }
}
