
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, UploadCloud, FileText, CheckCircle2, Download, ArrowRight, Wand2 } from 'lucide-react'
import { toast } from "sonner"
import { extractManuscriptData, generateFormattedDocx, ManuscriptData } from "./actions"

interface TypesettingEditorProps {
  journals: { id: string, name: string }[]
}

export function TypesettingEditor({ journals }: TypesettingEditorProps) {
  const [step, setStep] = useState<'upload' | 'analyze' | 'preview' | 'done'>('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Data State
  const [file, setFile] = useState<File | null>(null)
  const [targetJournalId, setTargetJournalId] = useState<string>("")
  const [extractedData, setExtractedData] = useState<ManuscriptData | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      if (!f.name.endsWith('.docx')) {
        toast.error("仅支持 .docx 文件")
        return
      }
      setFile(f)
    }
  }

  const startAnalysis = async () => {
    if (!file) return toast.error("请先上传文件")
    if (!targetJournalId) return toast.error("请选择目标期刊")
    
    setIsProcessing(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const result = await extractManuscriptData(formData)
      if (result.success && result.data) {
        setExtractedData(result.data)
        setStep('preview')
      } else {
        toast.error(result.error || "解析失败")
      }
    } catch (error) {
      console.error(error)
      toast.error("系统错误")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDataChange = (field: keyof ManuscriptData, value: any) => {
    if (!extractedData) return
    setExtractedData({ ...extractedData, [field]: value })
  }

  const generateDocx = async () => {
    if (!extractedData || !targetJournalId) return
    
    setIsProcessing(true)
    try {
      const result = await generateFormattedDocx(targetJournalId, extractedData)
      if (result.success && result.url) {
        setDownloadUrl(result.url)
        setStep('done')
        toast.success("排版完成！")
      } else {
        toast.error(result.error || "生成失败")
      }
    } catch (error) {
      console.error(error)
      toast.error("生成过程出错")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Stepper */}
      <div className="flex justify-between relative mb-12">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 -translate-y-1/2 rounded"></div>
        {['上传稿件', 'AI 解析', '确认内容', '下载结果'].map((label, idx) => {
          const currentStepIdx = ['upload', 'analyze', 'preview', 'done'].indexOf(step)
          const isCompleted = idx < currentStepIdx
          const isCurrent = idx === currentStepIdx
          
          return (
            <div key={idx} className="flex flex-col items-center bg-background px-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 transition-colors
                ${isCompleted || isCurrent ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'}
              `}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span>{idx + 1}</span>}
              </div>
              <span className={`text-sm font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Step 1: Upload & Select */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>上传与设置</CardTitle>
            <CardDescription>请选择您的原始稿件和希望匹配的目标期刊模板。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>目标期刊模板</Label>
                <Select value={targetJournalId} onValueChange={setTargetJournalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择期刊..." />
                  </SelectTrigger>
                  <SelectContent>
                    {journals.map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>上传稿件 (.docx)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors relative h-[120px] flex flex-col items-center justify-center">
                  <input 
                    type="file" 
                    accept=".docx" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                  {file ? (
                    <>
                      <FileText className="h-8 w-8 text-primary mb-2" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">点击或拖拽文件</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={startAnalysis}
              disabled={!file || !targetJournalId || isProcessing}
            >
              {isProcessing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在分析稿件结构...</>
              ) : (
                <><Wand2 className="mr-2 h-4 w-4" /> 开始 AI 排版</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview & Edit (Step 2 is implicit loading state) */}
      {step === 'preview' && extractedData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>内容确认</CardTitle>
                <CardDescription>AI 已提取您的稿件内容，请确认无误后生成。</CardDescription>
              </div>
              <Button onClick={generateDocx} disabled={isProcessing}>
                {isProcessing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 生成中...</>
                ) : (
                  <><FileText className="mr-2 h-4 w-4" /> 生成排版文件</>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>论文标题</Label>
                <Input 
                  value={extractedData.title} 
                  onChange={(e) => handleDataChange('title', e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>作者列表 (逗号分隔)</Label>
                    <Input 
                        value={extractedData.authors.join(', ')} 
                        onChange={(e) => handleDataChange('authors', e.target.value.split(',').map(s => s.trim()))}
                    />
                </div>
                 <div className="space-y-2">
                    <Label>关键词</Label>
                    <Input 
                        value={extractedData.keywords?.join(', ') || ''} 
                        onChange={(e) => handleDataChange('keywords', e.target.value.split(',').map(s => s.trim()))}
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label>摘要</Label>
                <Textarea 
                  value={extractedData.abstract} 
                  onChange={(e) => handleDataChange('abstract', e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="text-base">正文章节 ({extractedData.sections.length})</Label>
                {extractedData.sections.map((sec, idx) => (
                    <div key={idx} className="border rounded-md p-4 bg-muted/20 space-y-4">
                        {/* Level 1 Section */}
                        <div>
                            <Input 
                                value={sec.heading}
                                onChange={(e) => {
                                    const newSections = [...extractedData.sections]
                                    newSections[idx].heading = e.target.value
                                    handleDataChange('sections', newSections)
                                }}
                                className="mb-2 font-bold text-lg border-none bg-transparent px-0"
                                placeholder="一级标题"
                            />
                            <Textarea 
                                value={sec.content.join('\n')}
                                onChange={(e) => {
                                    const newSections = [...extractedData.sections]
                                    newSections[idx].content = e.target.value.split('\n')
                                    handleDataChange('sections', newSections)
                                }}
                                className="min-h-[100px] text-sm"
                                placeholder="章节内容 (按回车分段)..."
                            />
                        </div>

                        {/* Subsections */}
                        {sec.subsections && sec.subsections.length > 0 && (
                            <div className="pl-4 border-l-2 border-primary/20 space-y-4">
                                {sec.subsections.map((sub, subIdx) => (
                                    <div key={subIdx}>
                                        <Input 
                                            value={sub.heading}
                                            onChange={(e) => {
                                                const newSections = [...extractedData.sections]
                                                if (newSections[idx].subsections) {
                                                    newSections[idx].subsections![subIdx].heading = e.target.value
                                                    handleDataChange('sections', newSections)
                                                }
                                            }}
                                            className="mb-1 font-semibold text-sm h-8"
                                            placeholder="二级标题"
                                        />
                                        <Textarea 
                                            value={sub.content.join('\n')}
                                            onChange={(e) => {
                                                const newSections = [...extractedData.sections]
                                                if (newSections[idx].subsections) {
                                                    newSections[idx].subsections![subIdx].content = e.target.value.split('\n')
                                                    handleDataChange('sections', newSections)
                                                }
                                            }}
                                            className="min-h-[80px] text-xs"
                                            placeholder="子章节内容..."
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && downloadUrl && (
        <Card className="text-center py-12 animate-in zoom-in-95">
          <CardContent className="flex flex-col items-center gap-6">
            <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">排版完成！</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                您的文档已根据目标期刊模板重新生成。请下载后仔细检查格式细节。
              </p>
            </div>
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep('upload')}>
                    处理下一篇
                </Button>
                <a href={downloadUrl} download="formatted-manuscript.docx">
                    <Button size="lg" className="gap-2">
                        <Download className="h-5 w-5" /> 下载文档
                    </Button>
                </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
