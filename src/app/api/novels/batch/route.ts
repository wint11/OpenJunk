import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json([])
    }

    const novels = await prisma.novel.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        title: true,
        author: true,
        coverUrl: true,
        category: true,
        views: true,
        rating: true,
        status: true,
        updatedAt: true,
        description: true,
        journal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(novels)
  } catch (error) {
    console.error("Error fetching novels:", error)
    return NextResponse.json({ error: "Failed to fetch novels" }, { status: 500 })
  }
}
