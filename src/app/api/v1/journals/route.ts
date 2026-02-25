
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const journals = await prisma.journal.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        description: true,
        coverUrl: true,
        _count: {
          select: { papers: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedJournals = journals.map((journal) => ({
      id: journal.id,
      name: journal.name,
      description: journal.description,
      coverUrl: journal.coverUrl,
      paperCount: journal._count.papers,
    }))

    return NextResponse.json(formattedJournals)
  } catch (error) {
    console.error("Error fetching journals:", error)
    return NextResponse.json(
      { error: "Failed to fetch journals" },
      { status: 500 }
    )
  }
}
