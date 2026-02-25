import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"

interface PdfReaderPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PdfReaderPage({ params }: PdfReaderPageProps) {
  const { id } = await params
  const novel = await prisma.novel.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      pdfUrl: true,
      author: true
    }
  })

  if (!novel || !novel.pdfUrl) {
    notFound()
  }

  // Ensure pdfUrl is a proper URL path
  // If pdfUrl already starts with 'http' (external link) or '/' (absolute path), use it as is.
  // Otherwise, assume it's a filename in '/uploads/pdfs/' (legacy behavior)
  let pdfUrl = novel.pdfUrl
  if (!pdfUrl.startsWith('http') && !pdfUrl.startsWith('/')) {
    pdfUrl = `/uploads/pdfs/${pdfUrl}`
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Reader Header */}
      <header className="flex-shrink-0 h-14 bg-background border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/novel/${novel.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回详情
            </Link>
          </Button>
          <div className="flex flex-col">
             <h1 className="text-sm font-semibold truncate max-w-[300px] md:max-w-md">
               {novel.title}
             </h1>
             <span className="text-xs text-muted-foreground">{novel.author}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <Button size="sm" variant="outline" asChild>
             <a href={pdfUrl} download>
               <Download className="h-4 w-4 mr-2" />
               下载
             </a>
           </Button>
        </div>
      </header>

      {/* PDF Viewer */}
      <main className="flex-1 overflow-hidden relative">
        <iframe 
          src={pdfUrl} 
          className="w-full h-full border-none"
          title={`${novel.title} PDF Reader`}
        />
      </main>
    </div>
  )
}
