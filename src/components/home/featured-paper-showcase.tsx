"use client"

import { useState } from "react"
import Link from "next/link"
import { Novel } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Eye, FileText, ChevronRight, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeaturedPaperShowcaseProps {
  papers: (Novel & {
    journal: { id: string; name: string } | null
  })[]
}

export function FeaturedPaperShowcase({ papers }: FeaturedPaperShowcaseProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedPaper = papers[selectedIndex]

  if (!papers || papers.length === 0) return null

  // Ensure pdfUrl is a proper URL path for the preview
  const getPdfUrl = (url: string | null) => {
    if (!url) return null
    if (url.startsWith('http') || url.startsWith('/')) return url
    return `/uploads/pdfs/${url}`
  }

  const pdfUrl = getPdfUrl(selectedPaper.pdfUrl)

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Left Sidebar: Paper List & Meta Info */}
      <div className="w-full lg:w-1/3 flex flex-col border-r bg-muted/10 z-10 relative shadow-xl">
        {/* Header */}
        <div className="p-6 border-b bg-background/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            精选论文推荐
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            OpenJunk 每日为您甄选最离谱的学术垃圾
          </p>
        </div>

        {/* Paper List (Scrollable) */}
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {papers.map((paper, index) => (
              <button
                key={paper.id}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-3 items-start group",
                  selectedIndex === index ? "bg-muted border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                )}
              >
                <div className="mt-1 font-mono text-xs text-muted-foreground w-6 text-center">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className={cn(
                    "font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors",
                    selectedIndex === index ? "text-primary" : "text-foreground"
                  )}>
                    {paper.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{paper.author}</span>
                    <span>•</span>
                    <span>{new Date(paper.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {selectedIndex === index && (
                  <ChevronRight className="h-4 w-4 text-primary animate-in fade-in slide-in-from-left-1" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
        
        {/* Selected Paper Meta (Sticky Bottom) */}
        <div className="p-6 border-t bg-background space-y-4">
           <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedPaper.category}</Badge>
                {selectedPaper.journal && (
                   <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer" asChild>
                      <Link href={`/journals/${selectedPaper.journal.id}`}>
                        {selectedPaper.journal.name}
                      </Link>
                   </Badge>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                   <Eye className="h-3 w-3" /> {selectedPaper.views}
                </span>
              </div>
              <h1 className="text-xl font-bold leading-snug">
                {selectedPaper.title}
              </h1>
              <p className="text-sm text-muted-foreground line-clamp-3">
                 {selectedPaper.description || "暂无摘要"}
              </p>
           </div>
           
           <div className="flex gap-3 pt-2">
              <Button className="flex-1" asChild>
                 <Link href={`/novel/${selectedPaper.id}`}>
                    阅读全文
                 </Link>
              </Button>
              {pdfUrl && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={pdfUrl} download title="下载 PDF">
                        <Download className="h-4 w-4" />
                    </a>
                  </Button>
              )}
           </div>
        </div>
      </div>

      {/* Right Content: PDF Preview */}
      <div className="hidden lg:flex flex-1 bg-muted/20 relative items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* PDF Container */}
        {pdfUrl ? (
            <div className="relative w-full max-w-4xl h-full shadow-2xl rounded-lg overflow-hidden border bg-white animate-in zoom-in-95 duration-500 fade-in">
                {/* We use an iframe to show the PDF. Most modern browsers render PDF natively.
                    To show "first page only" style, we can try using #page=1 in URL hash, 
                    though it depends on the viewer.
                    Alternatively, we just show the whole PDF viewer which is fine for "preview".
                */}
                <iframe 
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="w-full h-full border-none bg-white"
                    title="PDF Preview"
                />
                
                {/* Overlay to prevent interaction if desired, or let user scroll */}
                {/* <div className="absolute inset-0 z-10" /> */}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="h-16 w-16 mb-4 opacity-20" />
                <p>暂无 PDF 预览</p>
            </div>
        )}
      </div>
    </div>
  )
}
