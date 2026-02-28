import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ApplyForm } from "./apply-form"
import { Badge } from "@/components/ui/badge"

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fund = await prisma.fund.findUnique({
    where: { id },
    include: { category: true }
  })

  if (!fund || fund.status !== "ACTIVE") {
    notFound()
  }

  const departments = await prisma.fundDepartment.findMany({
    where: { categoryId: fund.categoryId },
    orderBy: { code: 'asc' }
  })

  return (
    <div className="min-h-screen bg-muted/10 py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center space-y-2">
           <Badge variant="outline" className="mb-2">{fund.category.name}</Badge>
          <h1 className="text-3xl font-bold tracking-tight">申报项目：{fund.title}</h1>
          <p className="text-muted-foreground">请填写有效的申报信息。提交后将生成唯一的申请ID，请妥善保管。</p>
        </div>
        
        <ApplyForm fund={fund} departments={departments} />
      </div>
    </div>
  )
}
