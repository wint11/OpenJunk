'use client'

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { incrementPopularity } from "@/lib/popularity"

interface DownloadButtonProps {
  novelId: string
  pdfUrl: string
}

export function DownloadButton({ novelId, pdfUrl }: DownloadButtonProps) {
  const handleDownload = () => {
    // Increment popularity
    incrementPopularity(novelId, 'DOWNLOAD')
  }

  const getFileLabel = (url: string) => {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.endsWith('.pdf')) return '下载PDF'
    if (lowerUrl.endsWith('.docx') || lowerUrl.endsWith('.doc')) return '下载Word'
    if (lowerUrl.endsWith('.zip') || lowerUrl.endsWith('.rar') || lowerUrl.endsWith('.7z')) return '下载压缩包'
    if (lowerUrl.endsWith('.tex')) return '下载LaTeX'
    return '下载文件'
  }

  return (
    <Button variant="outline" size="lg" asChild onClick={handleDownload}>
      <a href={pdfUrl} download>
        <Download className="mr-2 h-4 w-4" />
        {getFileLabel(pdfUrl)}
      </a>
    </Button>
  )
}
