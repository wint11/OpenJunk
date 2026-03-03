
'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UploadCloud, FileText, Loader2, AlertCircle } from 'lucide-react'
import { uploadAndAnalyze } from '../actions'
import { ExtractedMetadata } from '@/lib/ai-analysis'

interface Step1Props {
  onNext: (file: { name: string, tempPath: string }, metadata: ExtractedMetadata) => void
}

export function Step1Upload({ onNext }: Step1Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError(null)
    
    // Client-side validation
    const isDocx = file.name.toLowerCase().endsWith('.docx')
    const isDoc = file.name.toLowerCase().endsWith('.doc')
    
    if (!isDocx && !isDoc) {
      setError("仅支持 Word 文档 (.docx, .doc)")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("文件大小不能超过 10MB")
      return
    }

    setIsAnalyzing(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadAndAnalyze(formData)

      if (result.success && result.tempFilePath) {
        // Proceed to next step with metadata (even if empty)
        onNext(
            { name: file.name, tempPath: result.tempFilePath }, 
            result.metadata || {}
        )
      } else {
        setError(result.message || "上传失败，请重试")
      }
    } catch (err) {
      console.error(err)
      setError("发生意外错误，请重试")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>上传稿件</CardTitle>
        <CardDescription>
          上传 Word 文档，AI 将自动提取标题、摘要和作者信息，为您智能推荐期刊。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
            flex flex-col items-center justify-center gap-4 min-h-[300px]
            ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}
            ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".docx,.doc" 
            onChange={handleFileSelect}
          />
          
          {isAnalyzing ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="space-y-2">
                <h3 className="text-xl font-medium text-primary">AI 正在阅读您的稿件...</h3>
                <p className="text-sm text-muted-foreground">正在分析：标题、摘要、作者信息</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-primary/10 rounded-full">
                <UploadCloud className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">点击或拖拽文件到此处</h3>
                <p className="text-sm text-muted-foreground">支持 .docx, .doc (最大 10MB)</p>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
