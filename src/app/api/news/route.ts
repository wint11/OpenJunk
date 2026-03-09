import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const news = await prisma.news.findMany({
      where: { active: true },
      orderBy: { priority: "asc" },
      select: {
        id: true,
        content: true,
        link: true,
        priority: true,
        active: true
      }
    })
    return NextResponse.json(news)
  } catch (error) {
    console.error("Failed to fetch news:", error)
    return NextResponse.json([], { status: 500 })
  }
}
