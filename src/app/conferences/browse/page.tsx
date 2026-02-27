
import { prisma } from "@/lib/prisma"
import { PaperCard } from "@/components/paper-card"
import { Metadata } from "next"
import { Novel, Prisma } from "@prisma/client"
import { BookX, Filter, SortAsc, Search, Mic2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = {
  title: "浏览会议论文 - OpenJunk",
}

interface BrowsePageProps {
  searchParams: Promise<{
    sort?: string
    category?: string
    journal?: string
    q?: string
  }>
}

export default async function BrowseConferencePapersPage({ searchParams }: BrowsePageProps) {
  const { sort, category, journal, q } = await searchParams
  
  const orderBy: Prisma.NovelOrderByWithRelationInput = sort === 'popular' 
    ? { popularity: 'desc' } 
    : { createdAt: 'desc' }

  const where: Prisma.NovelWhereInput = {
    status: 'PUBLISHED',
    conference: { 
        status: 'ACTIVE',
    },
    ...(category ? { category } : {}),
    ...(journal ? { conferenceId: journal } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q } },
        { author: { contains: q } },
        { description: { contains: q } }
      ]
    } : {})
  }

  const novels = await prisma.novel.findMany({
    where,
    orderBy,
    take: 50,
    include: {
      conference: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  // Get all categories for sidebar
  const categories = await prisma.novel.groupBy({
    by: ['category'],
    _count: {
      category: true
    },
    where: {
      status: 'PUBLISHED',
      conference: { 
          status: 'ACTIVE',
      },
      category: {
        not: "" 
      }
    }
  })

  // Get all active conferences for sidebar
  const conferences = await prisma.conference.findMany({
    where: { 
        status: 'ACTIVE',
    },
    select: { id: true, name: true }
  })

  // Sort by Pinyin
  conferences.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
  categories.sort((a, b) => (a.category || "").localeCompare(b.category || "", "zh-CN"))

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row gap-8 relative">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-8 flex-shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              筛选
            </h3>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">所属会议</h4>
              <div className="flex flex-col space-y-1">
                <Link 
                  href={`/conferences/browse?${new URLSearchParams({ ...(q && { q }), ...(sort && { sort }), ...(category && { category }) }).toString()}`}
                  className={`text-sm py-1 px-2 rounded-md transition-colors ${!journal ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  全部会议
                </Link>
                {conferences.map((c) => (
                  <Link 
                    key={c.id}
                    href={`/conferences/browse?${new URLSearchParams({ ...(q && { q }), ...(sort && { sort }), ...(category && { category }), journal: c.id }).toString()}`}
                    className={`text-sm py-1 px-2 rounded-md transition-colors ${journal === c.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">学科分类</h4>
              <div className="flex flex-col space-y-1">
                <Link 
                  href={`/conferences/browse?${new URLSearchParams({ ...(q && { q }), ...(sort && { sort }), ...(journal && { journal }) }).toString()}`}
                  className={`text-sm py-1 px-2 rounded-md transition-colors ${!category ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  全部分类
                </Link>
                {categories.map((c) => (
                  <Link 
                    key={c.category}
                    href={`/conferences/browse?${new URLSearchParams({ ...(q && { q }), ...(sort && { sort }), ...(journal && { journal }), category: c.category }).toString()}`}
                    className={`text-sm py-1 px-2 rounded-md transition-colors ${category === c.category ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                  >
                    {c.category} <span className="text-xs text-muted-foreground ml-1">({c._count.category})</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold tracking-tight">会议论文</h1>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <form className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="q"
                  placeholder="搜索标题、作者..." 
                  className="pl-9"
                  defaultValue={q}
                />
                {sort && <input type="hidden" name="sort" value={sort} />}
                {category && <input type="hidden" name="category" value={category} />}
                {journal && <input type="hidden" name="journal" value={journal} />}
              </form>

              <div className="flex items-center border rounded-md p-1 bg-muted/20">
                 <Link
                   href={`/conferences/browse?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), ...(journal && { journal }) }).toString()}`}
                   className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${!sort ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                   <SortAsc className="h-4 w-4 inline mr-1" />
                   最新
                 </Link>
                 <Link
                   href={`/conferences/browse?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), ...(journal && { journal }), sort: 'popular' }).toString()}`}
                   className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${sort === 'popular' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                   <Filter className="h-4 w-4 inline mr-1" />
                   最热
                 </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {novels.length === 0 ? (
              <div className="text-center py-20 border rounded-lg bg-muted/10">
                <BookX className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">暂无相关论文</h3>
                <p className="text-muted-foreground mt-1">换个搜索词试试？</p>
                {(q || category || journal) && (
                  <Button variant="link" asChild className="mt-4">
                    <Link href="/conferences/browse">
                      清除所有筛选
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              novels.map((novel) => (
                <PaperCard key={novel.id} paper={novel} />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
