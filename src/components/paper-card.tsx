import Link from "next/link"
import { Novel } from "@prisma/client"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Calendar, FileText, Download, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaperCardProps {
  paper: Novel & {
    journal?: {
      id: string
      name: string
    } | null
  }
}

export function PaperCard({ paper }: PaperCardProps) {
  // Mock abstract since it's not in the Novel model directly (it's in description)
  const abstract = paper.description || "暂无摘要"

  return (
    <Card className="group hover:shadow-md transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <Link href={`/novel/${paper.id}`} className="block">
              <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                {paper.title}
              </h3>
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{paper.author}</span>
              <span>•</span>
              {paper.journal && (
                <>
                  <Link href={`/browse?journal=${paper.journal.id}`} className="text-primary hover:underline">
                    {paper.journal.name}
                  </Link>
                  <span>•</span>
                </>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {paper.updatedAt.toLocaleDateString('zh-CN')}
              </span>
              <span>•</span>
              <Badge variant="secondary" className="text-xs font-normal">
                {paper.category}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {abstract}
        </p>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            {Math.round(paper.popularity || 0)} 热度
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            PDF
          </span>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
            <Link href={`/novel/${paper.id}`}>
              查看详情
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
