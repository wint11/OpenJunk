'use server'

import { prisma } from "@/lib/prisma"
import { searchShortcuts } from "@/config/search-shortcuts"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { headers } from "next/headers"

export async function handleSearch(query: string) {
  if (!query || !query.trim()) return;

  const trimmedQuery = query.trim();
  const session = await auth();
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || "127.0.0.1";

  // 1. Log the search (fire and forget, but await to ensure it starts)
  try {
      await prisma.searchLog.create({
          data: {
              query: trimmedQuery,
              userId: session?.user?.id,
              ip: ip,
              type: 'ALL'
          }
      });
  } catch (e) {
      console.error("Failed to log search", e);
  }

  // 2. Check for shortcuts (Fuzzy match)
  // Logic: 
  // - Case insensitive
  // - Match if query contains keyword OR keyword contains query
  const lowerQuery = trimmedQuery.toLowerCase();
  
  // Sort by length descending to prioritize more specific keywords (e.g. "PPT Contest" over "PPT")
  const sortedShortcuts = [...searchShortcuts].sort((a, b) => b.keyword.length - a.keyword.length);
  
  const shortcut = sortedShortcuts.find(s => {
      const lowerKeyword = s.keyword.toLowerCase();
      // Forward match: "我想参加PPT大赛" includes "PPT大赛"
      if (lowerQuery.includes(lowerKeyword)) return true;
      // Reverse match: "PPT" is included in "PPT大赛" (but avoid single letters matching everything)
      if (lowerQuery.length > 1 && lowerKeyword.includes(lowerQuery)) return true;
      return false;
  });

  if (shortcut) {
      redirect(shortcut.url);
  }

  // 3. Easter Egg: Random Paper
  let randomNovelId: string | null = null;
  if (trimmedQuery.includes('随机') || trimmedQuery.toLowerCase().includes('random') || trimmedQuery.includes('随便看看')) {
       try {
           const count = await prisma.novel.count({
               where: { status: 'PUBLISHED' }
           });
           
           if (count > 0) {
               const skip = Math.floor(Math.random() * count);
               const randomNovel = await prisma.novel.findFirst({
                   where: { status: 'PUBLISHED' },
                   skip 
               });
               if (randomNovel) {
                   randomNovelId = randomNovel.id;
               }
           }
       } catch (e) {
           console.error("Failed to fetch random novel", e);
       }
  }

  if (randomNovelId) {
      redirect(`/novel/${randomNovelId}/read`);
  }

  // 4. If no shortcut, redirect to search page
  redirect(`/search?q=${encodeURIComponent(trimmedQuery)}`);
}

export async function getTrendingPlaceholders() {
    // Retrieve top 5 trending topics from DB (manual or auto)
    try {
        const trending = await prisma.trendingTopic.findMany({
            orderBy: { score: 'desc' },
            take: 5
        });
        return trending.map(t => t.keyword);
    } catch (e) {
        return [];
    }
}
