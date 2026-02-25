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

  return (
    <Button variant="outline" size="lg" asChild onClick={handleDownload}>
      <a href={pdfUrl} download>
        <Download className="mr-2 h-4 w-4" />
        下载PDF
      </a>
    </Button>
  )
}
