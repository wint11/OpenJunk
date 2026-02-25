
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get top 10 papers by popularity
    const trends = await prisma.novel.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
        coverUrl: true,
        views: true,
        popularity: true,
        createdAt: true,
        journal: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        popularity: "desc",
      },
      take: 10,
    })

    return NextResponse.json(trends.map((paper) => ({
      ...paper,
      journalName: paper.journal?.name,
    })))
  } catch (error) {
    console.error("Error fetching trends:", error)
    return NextResponse.json(
      { error: "Failed to fetch trends" },
      { status: 500 }
    )
  }
}
