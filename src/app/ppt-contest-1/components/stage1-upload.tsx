"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitPPT, convertPPTForPreview } from "../actions"
import { Loader2, Upload, CheckCircle, AlertCircle, FileText, Presentation, X, ArrowLeft, Image as ImageIcon, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import dynamic from 'next/dynamic'

// Dynamically import PdfPreview with ssr disabled to avoid DOMMatrix error
const PdfPreview = dynamic(() => import('./pdf-preview'), { 
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center gap-4 h-full min-h-[400px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">加载预览组件...</p>
        </div>
    )
});

declare global {
    interface Window {
        $?: any;
    }
}

export function Stage1Upload() {
  const [isUploading, setIsUploading] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    setSelectedFile(file)
    setError("")
    setPreviewUrl(null)

    if (file.type === "application/pdf") {
       setError("不支持 PDF 格式，请上传 PPT 或 PPTX")
       setSelectedFile(null)
       return
    }

    // Automatically trigger server-side conversion for preview
    handleGeneratePreview(file);
  }

  const handleGeneratePreview = async (file: File) => {
      setIsConverting(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      
      const result = await convertPPTForPreview(formData);
      
      if (result.success && result.previewUrl) {
          setPreviewUrl(result.previewUrl);
      } else if (result.error) {
          setError(result.error);
          setPreviewUrl(null);
      }
      setIsConverting(false);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.name.match(/\.(ppt|pptx)$/i)) {
        processFile(file)
      } else {
        setError("不支持的文件格式，请上传 PPT 或 PPTX")
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const clearFile = () => {
      setSelectedFile(null)
      setPreviewUrl(null)
      if (fileInputRef.current) {
          fileInputRef.current.value = ""
      }
  }

  // New state for server-side preview
  const [serverPreviewUrl, setServerPreviewUrl] = useState<string | null>(null)

  if (isSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-background">
        <div className="h-24 w-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
             <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-3xl font-bold mb-4">上传成功！</h3>
        
        {/* Show the server-generated PDF preview if available */}
        {serverPreviewUrl ? (
            <div className="w-full max-w-5xl h-[600px] border rounded-lg overflow-hidden mb-6 shadow-md bg-white relative bg-slate-100 flex items-center justify-center">
                 <PdfPreview url={serverPreviewUrl} />
            </div>
        ) : (
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                您的作品已成功提交。请耐心等待第二阶段（3月16日）开启，届时您的作品将接受全网“乱讲”挑战。
            </p>
        )}
        
        <div className="flex gap-4 mt-6">
            <Button onClick={() => { setIsSuccess(false); setServerPreviewUrl(null); }} variant="outline" size="lg">
                继续上传
            </Button>
            <Button asChild size="lg">
                <Link href="/ppt-contest-1">返回大赛主页</Link>
            </Button>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    setError("")
    
    const formData = new FormData()
    formData.append("file", selectedFile)
    
    const result = await submitPPT(formData)
    
    if (result.error) {
      setError(result.error)
    } else {
      setIsSuccess(true)
      clearFile()
      // Store the preview URL returned by server
      if (result.previewUrl) {
          setServerPreviewUrl(result.previewUrl)
      }
    }
    setIsUploading(false)
  }

  return (
    <div className="flex flex-col h-full bg-background" onDrop={handleDrop} onDragOver={handleDragOver}>
      {/* Header Bar */}
      <div className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" asChild>
                 <Link href="/ppt-contest-1">
                     <ArrowLeft className="h-5 w-5" />
                 </Link>
             </Button>
             <div>
                 <h1 className="font-bold text-lg">制作上传</h1>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
              <Input 
                  ref={fileInputRef}
                  type="file" 
                  name="file" 
                  accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" 
                  className="hidden" 
                  onChange={handleFileChange}
              />
              
              {selectedFile ? (
                  <div className="flex items-center gap-4 mr-2 bg-muted/50 pl-3 pr-2 py-1.5 rounded-md border">
                      <div className="flex items-center gap-2 text-sm">
                          <Presentation className="h-4 w-4 text-orange-500" />
                          <span className="truncate max-w-[200px] font-medium">{selectedFile.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-background" onClick={clearFile}>
                          <X className="h-3 w-3" />
                      </Button>
                  </div>
              ) : null}

              <Button variant={selectedFile ? "outline" : "default"} onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  {selectedFile ? "重新选择" : "选择文件"}
              </Button>

              <Button onClick={handleSubmit} disabled={!selectedFile || isUploading}>
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploading ? "提交中" : "提交作品"}
              </Button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-muted/10 overflow-hidden flex flex-col items-center justify-center p-6">
          {previewUrl ? (
              <div className="w-full h-full max-w-6xl bg-white shadow-lg rounded-lg overflow-hidden border flex flex-col relative group">
                  <PdfPreview url={previewUrl} />
              </div>
          ) : isConverting ? (
              <div className="flex flex-col items-center justify-center gap-4 animate-pulse">
                  <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">正在转换 PPT...</h3>
                  <p className="text-muted-foreground">正在为您生成高清预览，请稍候</p>
              </div>
          ) : (
              <div className="text-center max-w-lg cursor-pointer" onClick={() => !selectedFile && fileInputRef.current?.click()}>
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-16 hover:bg-muted/30 transition-colors">
                      <div className="h-32 w-32 bg-muted rounded-full mx-auto mb-6 flex items-center justify-center">
                          <Upload className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">拖拽文件到这里</h3>
                      <p className="text-muted-foreground mb-8">或者点击右上角“选择文件”按钮</p>
                      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center"><Presentation className="h-3 w-3 mr-1" /> PPT / PPTX</span>
                      </div>
                  </div>
              </div>
          )}

          {error && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
                <AlertCircle className="h-4 w-4" />
                {error}
            </div>
          )}
      </div>
    </div>
  )
}
