'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, X, Check, ArrowRight } from "lucide-react"
import { rejectNovel, approveNovel } from "./actions"
import { UploadPdfDialog } from "./upload-pdf-dialog"
import { EditInfoDialog } from "./edit-info-dialog"

interface NovelAuditActionsProps {
  novel: {
    id: string
    title: string
    author: string
    description: string
    pdfUrl: string | null
    fundApplications: { id: string }[]
  }
  fundApplications: { id: string, title: string, serialNo: string | null }[]
}

export function NovelAuditActions({ novel, fundApplications }: NovelAuditActionsProps) {
  const [mode, setMode] = useState<'review' | 'publish'>('review')

  if (mode === 'publish') {
    return (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-300">
        <UploadPdfDialog novelId={novel.id} />
        
        <EditInfoDialog 
            novelId={novel.id}
            defaultTitle={novel.title}
            defaultAuthor={novel.author}
            defaultDescription={novel.description}
            defaultFundApplicationIds={novel.fundApplications.map(f => f.id)}
            fundApplications={fundApplications}
        />

        <form action={approveNovel}>
          <input type="hidden" name="novelId" value={novel.id} />
          <input type="hidden" name="feedback" value="录用发布" />
          <Button 
            size="sm" 
            type="submit" 
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="mr-2 h-4 w-4" />
            发布
          </Button>
        </form>

        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setMode('review')}
            className="text-muted-foreground"
        >
            返回
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Download Button */}
      <Button variant="outline" size="sm" asChild>
        <a 
          href={novel.pdfUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          download 
          className={!novel.pdfUrl ? "pointer-events-none opacity-50" : ""}
          title="下载稿件"
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">下载</span>
        </a>
      </Button>

      {/* Reject Form */}
      <form action={rejectNovel}>
        <input type="hidden" name="novelId" value={novel.id} />
        <input type="hidden" name="feedback" value="快速拒稿" />
        <Button 
          variant="destructive" 
          size="sm" 
          type="submit"
          title="拒稿"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">拒稿</span>
        </Button>
      </form>

      {/* Switch to Publish Mode */}
      <Button 
        size="sm" 
        onClick={() => setMode('publish')}
        className="bg-blue-600 hover:bg-blue-700"
        title="录用"
      >
        <Check className="h-4 w-4" />
        <span className="sr-only">录用</span>
      </Button>
    </div>
  )
}
