import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// This API should be called periodically by a Cron Job
// Example: Every hour
export async function GET(request: Request) {
  try {
    // Decay factor (e.g. 0.95 means 5% decay)
    const decayFactor = 0.95
    
    // Minimum popularity to keep (avoid tiny decimals)
    const minPopularity = 1.0

    // Update all novels with popularity > 1
    // Note: Prisma doesn't support mass update with calculation based on current value easily in one query without raw SQL for SQLite
    // But since we are using SQLite, we can use executeRaw
    
    await prisma.$executeRaw`
      UPDATE Novel 
      SET popularity = popularity * ${decayFactor} 
      WHERE popularity > ${minPopularity}
    `

    return NextResponse.json({ success: true, message: "Popularity decayed successfully" })
  } catch (error) {
    console.error("Failed to decay popularity:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
