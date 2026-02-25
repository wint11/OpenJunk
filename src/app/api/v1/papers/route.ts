
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const journalId = searchParams.get("journalId")
    const sort = searchParams.get("sort") || "latest" // latest, popular
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const skip = (page - 1) * limit

    const where: Prisma.NovelWhereInput = {
      status: "PUBLISHED",
      ...(journalId && { journalId }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { author: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    }

    const orderBy: Prisma.NovelOrderByWithRelationInput =
      sort === "popular"
        ? { popularity: "desc" }
        : { createdAt: "desc" }

    const [papers, total] = await Promise.all([
      prisma.novel.findMany({
        where,
        select: {
          id: true,
          title: true,
          author: true,
          description: true,
          coverUrl: true,
          pdfUrl: true, // Add pdfUrl to selection
          category: true,
          views: true,
          popularity: true,
          createdAt: true,
          journal: {
            select: {
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.novel.count({ where }),
    ])

    return NextResponse.json({
      data: papers.map((paper) => ({
        ...paper,
        journalName: paper.journal?.name,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching papers:", error)
    return NextResponse.json(
      { error: "Failed to fetch papers" },
      { status: 500 }
    )
  }
}
