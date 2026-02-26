import { prisma } from "@/lib/prisma"
import { PaperCard } from "@/components/paper-card"
import Link from "next/link"
import { ArrowRight, BookOpen, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default async function Home() {
  console.log("Fetching home page data...");
  const [featuredPapers, rawCategories, rawJournals] = await Promise.all([
    prisma.novel.findMany({
      where: { 
        status: 'PUBLISHED', 
        isRecommended: true,
        journal: { status: 'ACTIVE' }
      },
      take: 10,
      orderBy: { views: 'desc' },
      include: {
        journal: {
          select: { id: true, name: true }
        }
      }
    }),
    prisma.novel.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      where: {
        status: 'PUBLISHED',
        journal: { status: 'ACTIVE' },
        category: {
          not: "" // Ensure category is not empty/null
        }
      }
    }),
    prisma.journal.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
            select: { papers: true }
        }
      }
    })
  ])

  // Sort categories by count (desc) and take top 5
  const categories = rawCategories
    .filter(c => c.category && c.category.trim() !== "")
    .sort((a, b) => b._count.category - a._count.category)
    .slice(0, 5);
  
  // Sort journals by paper count (desc) then name (asc)
  const journals = rawJournals.sort((a, b) => {
    const countDiff = b._count.papers - a._count.papers;
    if (countDiff !== 0) return countDiff;
    return a.name.localeCompare(b.name, "zh-CN");
  }).slice(0, 5);

  
  console.log(`Featured: ${featuredPapers.length}, Categories: ${categories.length}`);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section with Search */}
      <section className="bg-muted/30 py-16 border-b">
        <div className="container mx-auto px-4 text-center space-y-8">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              OpenJunk
            </h1>
            <p className="text-xl text-muted-foreground">
              汇集全球底刊与垃圾论文，打造最真实的学术垃圾场
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto relative">
            <form action="/browse" className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  name="q"
                  placeholder="搜索论文标题、作者、关键词..." 
                  className="pl-10 h-12 text-lg bg-background shadow-sm"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                搜索
              </Button>
            </form>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar: Categories & Filters */}
        <aside className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              学科分类
            </h3>
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <Link 
                  key={cat.category} 
                  href={`/browse?category=${cat.category}`}
                  className="flex justify-between items-center px-3 py-2 rounded-md hover:bg-muted text-sm group transition-colors"
                >
                  <span className="font-medium group-hover:text-primary">{cat.category}</span>
                  <span className="bg-muted-foreground/10 text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                    {cat._count.category}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                旗下期刊
             </h3>
             <div className="flex flex-col gap-2">
                {journals.map(journal => (
                    <Link
                       key={journal.id}
                       href={`/journals/${journal.id}`}
                       className="block px-3 py-2 rounded-md hover:bg-muted transition-colors"
                    >
                       <div className="text-sm font-medium">{journal.name}</div>
                       <div className="text-xs text-muted-foreground mt-0.5">收录 {journal._count.papers} 篇</div>
                    </Link>
                ))}
                <Link href="/journals" className="text-xs text-primary hover:underline px-3 mt-2 inline-block">
                    查看全部期刊 &rarr;
                </Link>
             </div>
          </div>
          
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-10">
          {/* Featured Papers */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                精选论文
              </h2>
            </div>
            <div className="grid gap-6">
              {featuredPapers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
