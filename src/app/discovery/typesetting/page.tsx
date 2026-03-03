
import { prisma } from "@/lib/prisma"
import { TypesettingEditor } from "./typesetting-editor"

export default async function TypesettingPage() {
  // Fetch all active journals to offer as formatting targets
  const journals = await prisma.journal.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, description: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="container mx-auto py-8 px-4 min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">智能排版助手</h1>
        <p className="text-muted-foreground">
          上传您的稿件 (Docx)，AI 将自动为您调整格式以匹配目标期刊的官方模板。
        </p>
      </div>
      <TypesettingEditor journals={journals} />
    </div>
  )
}
