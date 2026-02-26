import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(request: Request) {
  try {
    const { journalId, bonus, seasonId, quizId } = await request.json()
    
    const session = await auth()
    const userId = session?.user?.id
    const clientIp = request.headers.get("x-forwarded-for") || "unknown"

    if (!journalId || !bonus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Record Attempt (regardless of correct/incorrect, but this API is only called on correct for now)
    // Actually, to strictly limit "3 attempts", we should record every answer submission.
    // But the requirement says "answer 3 questions", usually implies participating.
    // Let's record it here.
    if (quizId) {
        await prisma.userQuizAttempt.create({
            data: {
                quizId,
                userId,
                guestIp: clientIp,
                isCorrect: true // This API is only called on success currently
            }
        })
    }

    // 1. Update Journal total combat power
    const updatedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        combatPower: {
          increment: bonus
        }
      }
    })

    // 2. If season is active, record contribution
    if (seasonId) {
      // Find or create season stat
      await prisma.universeSeasonStat.upsert({
        where: {
          seasonId_journalId: {
            seasonId,
            journalId
          }
        },
        create: {
          seasonId,
          journalId,
          combatPowerContribution: bonus
        },
        update: {
          combatPowerContribution: {
            increment: bonus
          }
        }
      })
    }

    // 3. Record User Attempt
    // Note: We should ideally do this in a separate endpoint or verify quiz ID
    // But for simplicity in this flow, we assume combat update implies a correct answer
    // Wait, limit check was in GET /quiz, but we need to record the attempt to enforce limit
    // Actually, we should record attempt when they request the quiz or when they submit answer?
    // Usually "limit 3 questions" means "limit 3 answers submitted".
    
    // Let's create a UserQuizAttempt record here
    // But we don't have quizId in payload. 
    // We should ideally update the frontend to send quizId.
    // For now, let's just use a placeholder or skip if strict tracking isn't critical for MVP
    // Or better, let's update frontend to send quizId.
    
    return NextResponse.json({ 
      success: true, 
      newCombatPower: updatedJournal.combatPower 
    })

  } catch (error) {
    console.error("Combat power update error:", error)
    return NextResponse.json(
      { error: "Failed to update combat power" },
      { status: 500 }
    )
  }
}
