'use server'

import { prisma } from "@/lib/prisma"

export async function searchPapers(query: string) {
  if (!query || query.trim().length < 2) {
    return []
  }

  const papers = await prisma.novel.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: query } },
        { author: { contains: query } }
      ]
    },
    take: 10,
    select: {
      id: true,
      title: true,
      author: true,
      category: true,
      journal: { select: { name: true } },
      conference: { select: { name: true } }
    }
  })

  return papers.map(p => ({
    id: p.id,
    title: p.title,
    author: p.author,
    category: p.category,
    source: p.journal?.name || p.conference?.name || "Unknown Source"
  }))
}
