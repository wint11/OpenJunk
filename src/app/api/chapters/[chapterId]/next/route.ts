import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: { chapterId: string } | Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params
  if (!chapterId) {
    return NextResponse.json({ error: "Missing chapterId" }, { status: 400 })
  }
  const currentChapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { novelId: true, order: true },
  })

  if (!currentChapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
  }

  const nextChapter = await prisma.chapter.findFirst({
    where: {
      novelId: currentChapter.novelId,
      status: 'PUBLISHED',
      order: {
        gt: currentChapter.order,
      },
    },
    orderBy: {
      order: "asc",
    },
    select: { id: true, title: true, content: true, order: true },
  })

  return NextResponse.json({ chapter: nextChapter })
}
