import { prisma } from "@/lib/prisma"
import { PaperCard } from "@/components/paper-card"
import { Metadata } from "next"
import { Novel, Prisma } from "@prisma/client"
import { BookX, Filter, SortAsc, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = {
  title: "浏览论文 - OpenJunk",
}

interface BrowsePageProps {
  searchParams: Promise<{
    sort?: string
    journal?: string
    q?: string
    page?: string
  }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { sort, journal, q, page } = await searchParams
  
  const pageNumber = Number(page) || 1
  const pageSize = 20

  const orderBy: Prisma.NovelOrderByWithRelationInput = sort === 'popular' 
    ? { popularity: 'desc' } 
    : { createdAt: 'desc' }

  const where: Prisma.NovelWhereInput = {
    status: 'PUBLISHED',
    journal: { status: 'ACTIVE' },
    ...(journal ? { journalId: journal } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q } },
        { author: { contains: q } },
        { description: { contains: q } }
      ]
    } : {})
  }

  const [novels, totalCount] = await Promise.all([
    prisma.novel.findMany({
      where,
      orderBy,
      take: pageSize,
      skip: (pageNumber - 1) * pageSize,
      include: {
        journal: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.novel.count({ where })
  ])
  
  const totalPages = Math.ceil(totalCount / pageSize)

  // Helper to generate pagination links
  const getPageLink = (p: number) => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (sort) params.set('sort', sort)
      if (journal) params.set('journal', journal)
      params.set('page', p.toString())
      return `/journals/browse?${params.toString()}`
  }

  // Get all active journals for sidebar
  const journals = await prisma.journal.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true }
  })

  // Sort journals by Pinyin
  journals.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row gap-8 relative items-start">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-8 flex-shrink-0 sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              筛选
            </h3>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">所属期刊</h4>
              <div className="flex flex-col space-y-1">
                <Link 
                  href={`/journals/browse?${new URLSearchParams({ ...(q && { q }), ...(sort && { sort }) }).toString()}`}
                  className={`px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center ${!journal ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  <span>全部期刊</span>
                </Link>
                {journals.map((j) => (
                  <Link 
                    key={j.id}
                    href={`/journals/browse?journal=${j.id}${sort ? `&sort=${sort}` : ''}${q ? `&q=${q}` : ''}`}
                    className={`px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center ${journal === j.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                  >
                    <span>{j.name}</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-muted/30 p-4 rounded-lg border">
             <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {q ? `搜索结果: "${q}"` : "全部论文"}
                </h1>
                <span className="text-muted-foreground text-sm font-normal ml-2">
                  (共 {totalCount} 篇)
                </span>
             </div>
             
             <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
               {/* Simple Search in Header */}
               <form className="relative w-full sm:w-64" action="/journals/browse">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                   type="search" 
                   name="q"
                   placeholder="搜索..." 
                   defaultValue={q || ""}
                   className="pl-9 h-9 bg-background"
                 />
                 {sort && <input type="hidden" name="sort" value={sort} />}
                 {journal && <input type="hidden" name="journal" value={journal} />}
               </form>

               {/* Sort Buttons */}
               <div className="flex items-center border rounded-md p-1 bg-muted/20">
                  <Link
                    href={`/journals/browse?${new URLSearchParams({ ...(q && { q }), ...(journal && { journal }) }).toString()}`}
                    className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${!sort ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <SortAsc className="h-4 w-4 inline mr-1" />
                    最新
                  </Link>
                  <Link
                    href={`/journals/browse?${new URLSearchParams({ ...(q && { q }), ...(journal && { journal }), sort: 'popular' }).toString()}`}
                    className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${sort === 'popular' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Filter className="h-4 w-4 inline mr-1" />
                    最热
                  </Link>
               </div>
             </div>
          </div>

          {novels.length > 0 ? (
            <div className="space-y-6">
                <div className="grid gap-4">
                  {novels.map((novel) => (
                    <PaperCard key={novel.id} paper={novel} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-8">
                        {/* First Page */}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pageNumber <= 1}
                            asChild={pageNumber > 1}
                            title="首页"
                        >
                            {pageNumber > 1 ? (
                                <Link href={getPageLink(1)}>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Link>
                            ) : (
                                <span><ChevronsLeft className="h-4 w-4" /></span>
                            )}
                        </Button>

                        {/* Previous Page */}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pageNumber <= 1}
                            asChild={pageNumber > 1}
                            title="上一页"
                        >
                            {pageNumber > 1 ? (
                                <Link href={getPageLink(pageNumber - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Link>
                            ) : (
                                <span><ChevronLeft className="h-4 w-4" /></span>
                            )}
                        </Button>
                        
                        <div className="flex items-center gap-1 mx-2">
                            <span className="text-sm font-medium">第 {pageNumber} 页</span>
                            <span className="text-sm text-muted-foreground">/ 共 {totalPages} 页</span>
                        </div>

                        {/* Next Page */}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pageNumber >= totalPages}
                            asChild={pageNumber < totalPages}
                            title="下一页"
                        >
                            {pageNumber < totalPages ? (
                                <Link href={getPageLink(pageNumber + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <span><ChevronRight className="h-4 w-4" /></span>
                            )}
                        </Button>

                        {/* Last Page */}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pageNumber >= totalPages}
                            asChild={pageNumber < totalPages}
                            title="尾页"
                        >
                            {pageNumber < totalPages ? (
                                <Link href={getPageLink(totalPages)}>
                                    <ChevronsRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <span><ChevronsRight className="h-4 w-4" /></span>
                            )}
                        </Button>
                    </div>
                )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border rounded-lg bg-muted/10">
              <div className="bg-muted/50 p-6 rounded-full mb-4">
                <BookX className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">暂无相关论文</h3>
              <p className="mt-2 text-sm max-w-sm mx-auto">
                抱歉，没有找到符合条件的论文。请尝试切换分类或调整搜索关键词。
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link href="/journals/browse">
                  查看全部论文
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
