
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const paper = await prisma.novel.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
        coverUrl: true,
        pdfUrl: true,
        category: true,
        views: true,
        popularity: true,
        createdAt: true,
        journal: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    })

    if (!paper) {
      return NextResponse.json(
        { error: "Paper not found" },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.novel.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({
      data: {
        ...paper,
        journalName: paper.journal?.name,
        journalId: paper.journal?.id,
      },
    })
  } catch (error) {
    console.error("Error fetching paper detail:", error)
    return NextResponse.json(
      { error: "Failed to fetch paper details" },
      { status: 500 }
    )
  }
}
