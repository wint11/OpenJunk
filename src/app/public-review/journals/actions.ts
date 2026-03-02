'use server'

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

// Simple Levenshtein distance for similarity
function similarity(s1: string, s2: string) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength.toString());
}

function editDistance(s1: string, s2: string) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export async function searchNovels(query: string) {
  if (!query || query.trim().length < 2) return []

  // Fetch all DRAFT novels titles to compare in memory (assuming dataset is manageable)
  // If dataset is large, we need Full Text Search or pg_trgm
  const drafts = await prisma.novel.findMany({
    where: {
      status: 'DRAFT',
      journalId: { not: null }
    },
    select: {
      id: true,
      title: true,
      author: true,
      createdAt: true,
      journal: { select: { name: true } },
      uploader: { select: { name: true } }
    }
  })

  const results = drafts.filter(novel => {
    const sim = similarity(novel.title, query.trim())
    return sim >= 0.5 // 50% accuracy
  })

  return results
}

export async function checkIpMatches() {
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(',')[0] || "127.0.0.1"

  const matches = await prisma.novel.findMany({
    where: {
      status: 'DRAFT',
      uploaderIp: ip,
      journalId: { not: null }
    },
    select: {
      id: true,
      title: true // We might want to mask this initially? User needs to verify.
    }
  })

  return { ip, matches }
}

export async function verifyAuthorship(novelId: string, input: string) {
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { id: true, title: true, author: true }
  })

  if (!novel) return { success: false, message: "论文不存在" }

  // Verify against author name OR title (exact match)
  // Requirement: "补充作者信息...或者补充完整作品标题"
  const isTitleMatch = novel.title.trim().toLowerCase() === input.trim().toLowerCase()
  const isAuthorMatch = novel.author.trim().toLowerCase() === input.trim().toLowerCase()

  if (isTitleMatch || isAuthorMatch) {
    return { success: true, novel }
  }

  return { success: false, message: "验证失败：信息不匹配" }
}
