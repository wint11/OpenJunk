import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ReaderView } from "@/components/reader-view"
import { Metadata } from "next"

interface ChapterPageProps {
  params: Promise<{
    id: string
    chapterId: string
  }>
}

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const { chapterId } = await params
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { novel: true },
  })

  if (!chapter) {
    return { title: "Chapter Not Found" }
  }

  return {
    title: `${chapter.title} - ${chapter.novel.title}`,
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { id: novelId, chapterId } = await params

  const chapter = await prisma.chapter.findFirst({
    where: { 
      id: chapterId,
      status: 'PUBLISHED',
      novel: {
        status: 'PUBLISHED'
      }
    },
    include: {
      novel: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (!chapter) {
    notFound()
  }

  const chapters = await prisma.chapter.findMany({
    where: { 
      novelId,
      status: 'PUBLISHED'
    },
    select: { id: true, title: true, order: true, content: true, isVip: true },
    orderBy: { order: "asc" },
  })

  return (
    <ReaderView 
      chapter={chapter}
      chapters={chapters}
    />
  )
}
