import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"

interface PaperReaderPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PaperReaderPage({ params }: PaperReaderPageProps) {
  const { id } = await params
  const novel = await prisma.novel.findUnique({
    where: { id },
  })

  if (!novel || !novel.pdfUrl) {
    notFound()
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b bg-card shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/novel/${novel.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-sm font-medium truncate max-w-[300px] md:max-w-md" title={novel.title}>
            {novel.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={novel.pdfUrl} download>
              <Download className="mr-2 h-4 w-4" />
              下载
            </a>
          </Button>
        </div>
      </header>

      {/* PDF Viewer */}
      <main className="flex-1 overflow-hidden bg-muted/20">
        <iframe 
          src={novel.pdfUrl} 
          className="w-full h-full border-0" 
          title="PDF Viewer"
        />
      </main>
    </div>
  )
}
