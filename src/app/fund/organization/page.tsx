import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"

export default async function FundOrganizationPage() {
  const categories = await prisma.fundCategory.findMany({
    orderBy: { createdAt: 'asc' }, // Or by some other order
    include: {
      _count: {
        select: { funds: true, departments: true }
      }
    }
  })

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">基金组织介绍</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          了解各大基金管理机构的职能、资助范围及组织架构。
        </p>
      </div>

      <div className="space-y-12">
        {categories.map((category) => (
          <div key={category.id} className="group relative scroll-m-20" id={category.code}>
            <div className="absolute -inset-y-4 -inset-x-4 z-0 scale-95 bg-muted/30 opacity-0 transition group-hover:scale-100 group-hover:opacity-100 sm:rounded-2xl" />
            <div className="relative z-10 grid gap-8 md:grid-cols-3 items-start">
              
              {/* Left: Image & Stats */}
              <div className="space-y-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted shadow-sm">
                  {category.introImages ? (
                    <Image
                      src={category.introImages}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                      <span className="text-sm">暂无图片</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg border bg-card p-3 shadow-sm">
                    <div className="text-2xl font-bold">{category._count.departments}</div>
                    <div className="text-xs text-muted-foreground">下设部门</div>
                  </div>
                  <div className="rounded-lg border bg-card p-3 shadow-sm">
                    <div className="text-2xl font-bold">{category._count.funds}</div>
                    <div className="text-xs text-muted-foreground">资助项目</div>
                  </div>
                </div>
              </div>

              {/* Right: Content */}
              <div className="md:col-span-2 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
                    <Badge variant="outline" className="text-base font-normal px-2 py-0.5">
                      {category.code}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {category.description || "暂无简短描述"}
                  </p>
                </div>

                <Separator />

                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  {category.introContent ? (
                    <div className="whitespace-pre-wrap">{category.introContent}</div>
                  ) : (
                    <p className="text-muted-foreground italic">暂无详细介绍内容。</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-muted-foreground">暂无组织介绍信息。</p>
          </div>
        )}
      </div>
    </div>
  )
}
