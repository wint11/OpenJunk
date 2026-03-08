"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { submitPPT } from "../actions"
import { Loader2, Upload, CheckCircle, AlertCircle, X, ArrowLeft, Info, FileText as FileTextIcon } from "lucide-react"
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
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
    wechat: ""
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    setSelectedFile(file)
    setError("")
    setPreviewUrl(null)

    // Check if file is PDF
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
       setError("请上传 PDF 格式文件")
       setSelectedFile(null)
       return
    }

    // For PDF files, directly use the file for preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
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
      if (file.name.toLowerCase().endsWith('.pdf')) {
        processFile(file)
      } else {
        setError("不支持的文件格式，请上传 PDF")
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
                您的作品已成功提交。请耐心等待第二阶段（3月31日）开启，届时您的作品将接受全网"乱讲"挑战。
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
    if (!contactInfo.email) {
      setError("请先填写邮箱")
      return
    }
    
    setIsUploading(true)
    setError("")
    
    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("email", contactInfo.email)
    
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
                  accept=".pdf,application/pdf" 
                  className="hidden" 
                  onChange={handleFileChange}
              />
              
              {selectedFile ? (
                  <div className="flex items-center gap-4 mr-2 bg-muted/50 pl-3 pr-2 py-1.5 rounded-md border">
                      <div className="flex items-center gap-2 text-sm">
                          <FileTextIcon className="h-4 w-4 text-red-500" />
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

              <Button onClick={handleSubmit} disabled={!selectedFile || isUploading || showInstructions}>
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploading ? "提交中" : "提交作品"}
              </Button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-muted/10 overflow-hidden flex">
        {/* 参赛说明和联系方式表单 */}
        {showInstructions && (
          <div className="w-1/3 bg-background border-r p-6 overflow-y-auto">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">参赛说明</h3>
              </div>
              
              <div className="space-y-4 text-sm text-muted-foreground">
                <p><strong>比赛规则：</strong></p>
                <ul className="space-y-2 ml-4 list-disc">
                  <li>每人最多可上传3个PDF文件</li>
                  <li>内容可以随便来，不管每一页放啥</li>
                  <li>PDF文件大小不超过50MB</li>
                  <li>作品需为原创，不得侵犯他人版权</li>
                </ul>
                
                <p><strong>为何需要上传PDF？</strong></p>
                <ul className="space-y-2 ml-4 list-disc">
                  <li>PDF格式能确保在不同设备上显示效果一致</li>
                  <li>避免因PPT版本差异导致的格式错乱</li>
                  <li>便于在线预览和评审</li>
                </ul>
                
                <p><strong>PDF转换方法：</strong></p>
                <ul className="space-y-2 ml-4 list-disc">
                  <li>在PowerPoint中：文件 → 另存为 → 选择PDF格式</li>
                  <li>在WPS中：文件 → 输出为PDF</li>
                  <li>打印功能：选择"Microsoft Print to PDF"</li>
                </ul>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email" className="mb-2">邮箱 *</Label>
                  <Input 
                    id="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                    placeholder="请输入您的真实邮箱，仅用于获奖联系"
                  />
                </div>
                
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={() => setShowInstructions(false)}
                disabled={!contactInfo.email}
              >
                我已阅读并同意参赛说明
              </Button>
            </Card>
          </div>
        )}
        
        {/* 文件上传区域 */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {previewUrl ? (
            <div className="w-full h-full max-w-6xl bg-white shadow-lg rounded-lg overflow-hidden border flex flex-col relative group">
              <PdfPreview url={previewUrl} />
            </div>
          ) : (
            <div className="text-center max-w-lg cursor-pointer" onClick={() => !selectedFile && fileInputRef.current?.click()}>
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-16 hover:bg-muted/30 transition-colors">
                <div className="h-32 w-32 bg-muted rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-2">拖拽文件到这里</h3>
                <p className="text-muted-foreground mb-8">或者点击右上角"选择文件"按钮</p>
                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center"><FileTextIcon className="h-3 w-3 mr-1" /> PDF</span>
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
    </div>
  )
}