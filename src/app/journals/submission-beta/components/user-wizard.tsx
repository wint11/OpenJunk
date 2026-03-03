
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { submitSmartWork } from '../actions'
import { SmartSubmissionSchema, SmartSubmissionData } from '../schema'
import { toast } from "sonner"
import { Loader2, Plus, Trash2, UploadCloud, FileText, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { uploadAndAnalyze } from '../actions'

interface UserWizardProps {
  availableJournals: { id: string, name: string }[]
}

export function UserSubmissionWizard({ availableJournals }: UserWizardProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form State
  const [formData, setFormData] = useState<SmartSubmissionData>({
    title: "",
    description: "",
    type: "NOVEL",
    category: "",
    journalId: availableJournals.length === 1 ? availableJournals[0].id : "",
    tempFilePath: "",
    authors: [{ name: "", unit: "", isCorresponding: true, contact: "" }]
  })
  
  // File State
  const [uploadedFile, setUploadedFile] = useState<{name: string, path: string} | null>(null)

  const handleChange = (field: keyof SmartSubmissionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleAuthorChange = (index: number, field: string, value: any) => {
    const newAuthors = [...formData.authors]
    // @ts-ignore
    newAuthors[index][field] = value
    setFormData(prev => ({ ...prev, authors: newAuthors }))
  }

  const addAuthor = () => {
    setFormData(prev => ({
      ...prev,
      authors: [...prev.authors, { name: "", unit: "", isCorresponding: false }]
    }))
  }

  const removeAuthor = (index: number) => {
    if (formData.authors.length <= 1) return
    const newAuthors = formData.authors.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, authors: newAuthors }))
  }

  const toggleCorresponding = (index: number) => {
    const newAuthors = [...formData.authors]
    newAuthors[index].isCorresponding = !newAuthors[index].isCorresponding
    setFormData(prev => ({ ...prev, authors: newAuthors }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
        toast.error("内部发布仅支持 PDF 格式")
        return
    }

    setIsUploading(true)
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    try {
        const res = await uploadAndAnalyze(formDataUpload)
        if (res.success && res.tempFilePath) {
            setUploadedFile({ name: file.name, path: res.tempFilePath })
            setFormData(prev => ({ ...prev, tempFilePath: res.tempFilePath! }))
            toast.success("PDF 上传成功")
        } else {
            toast.error(res.message || "上传失败")
        }
    } catch (err) {
        console.error(err)
        toast.error("上传出错")
    } finally {
        setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrors({})

    const result = SmartSubmissionSchema.safeParse(formData)
    
    if (!result.success) {
      const formattedErrors: Record<string, string> = {}
      result.error.errors.forEach(err => {
        const path = err.path.join('.')
        formattedErrors[path] = err.message
      })
      setErrors(formattedErrors)
      toast.error("请检查表单填写是否正确")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await submitSmartWork(result.data)
      if (response.success) {
        toast.success("发布成功！文章已上线。")
        router.push('/journals') 
      } else {
        toast.error(response.error || "发布失败")
      }
    } catch (error) {
      console.error(error)
      toast.error("网络错误，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold mb-2">快速发布通道</h1>
           <p className="text-muted-foreground">内部人员/编辑专用，直接发布 PDF 稿件</p>
        </div>
        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1" /> 已认证身份
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>发布至期刊 <span className="text-red-500">*</span></Label>
                {availableJournals.length > 1 ? (
                    <Select 
                        value={formData.journalId} 
                        onValueChange={(val) => handleChange('journalId', val)}
                    >
                        <SelectTrigger className={errors.journalId ? "border-red-500" : ""}>
                            <SelectValue placeholder="选择期刊" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableJournals.map(j => (
                                <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : availableJournals.length === 1 ? (
                    <div className="p-2 border rounded-md bg-muted text-muted-foreground font-medium">
                        {availableJournals[0].name}
                    </div>
                ) : (
                    <div className="text-red-500 text-sm">无可用期刊权限</div>
                )}
                {errors.journalId && <p className="text-sm text-red-500">{errors.journalId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">论文标题 <span className="text-red-500">*</span></Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={errors.title ? "border-red-500" : ""}
                  placeholder="请输入论文完整标题"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">论文类型</Label>
                   <Select 
                    value={formData.type} 
                    onValueChange={(val) => handleChange('type', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOVEL">期刊论文 (Journal Paper)</SelectItem>
                      <SelectItem value="PAPER">会议论文 (Conference Paper)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">学科分类 <span className="text-red-500">*</span></Label>
                    <Input 
                    id="category" 
                    value={formData.category} 
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder="例如：计算机科学"
                    className={errors.category ? "border-red-500" : ""}
                    />
                    {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">摘要 (Abstract) <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
                  placeholder="请输入论文摘要..."
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base">作者信息</CardTitle>
              <Button size="sm" variant="outline" onClick={addAuthor}>
                <Plus className="h-4 w-4 mr-2" /> 添加作者
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.authors && <p className="text-sm text-red-500 mb-2">{errors.authors}</p>}
              
              {formData.authors.map((author, index) => (
                <div key={index} className="relative p-4 border rounded-md bg-card space-y-3">
                   <div className="flex justify-between items-center">
                      <Label className="text-muted-foreground text-xs">第 {index + 1} 作者</Label>
                      {formData.authors.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAuthor(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                       <Input 
                          value={author.name} 
                          onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                          className={`h-8 ${errors[`authors.${index}.name`] ? "border-red-500" : ""}`}
                          placeholder="姓名 *"
                       />
                     </div>
                     <div className="space-y-1">
                       <Input 
                          value={author.unit || ''} 
                          onChange={(e) => handleAuthorChange(index, 'unit', e.target.value)}
                          className="h-8"
                          placeholder="单位"
                       />
                     </div>
                   </div>

                   <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id={`cor-${index}`}
                          checked={author.isCorresponding}
                          onChange={() => toggleCorresponding(index)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`cor-${index}`} className="cursor-pointer text-sm">通讯作者</Label>
                      </div>
                      
                      {author.isCorresponding && (
                        <div className="flex-1">
                          <Input 
                            placeholder="联系方式 *" 
                            value={author.contact || ''}
                            onChange={(e) => handleAuthorChange(index, 'contact', e.target.value)}
                            className={`h-8 ${errors[`authors.${index}.contact`] ? "border-red-500" : ""}`}
                          />
                        </div>
                      )}
                   </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - File Upload */}
        <div className="space-y-6">
          <Card className={errors.tempFilePath ? "border-red-500" : ""}>
            <CardHeader>
              <CardTitle>文件上传</CardTitle>
              <CardDescription>仅支持 PDF 格式</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors relative">
                <input 
                    type="file" 
                    accept=".pdf" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                />
                {isUploading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <span className="text-sm text-muted-foreground">上传中...</span>
                    </div>
                ) : uploadedFile ? (
                    <div className="flex flex-col items-center">
                        <FileText className="h-8 w-8 text-green-600 mb-2" />
                        <span className="text-sm font-medium break-all">{uploadedFile.name}</span>
                        <span className="text-xs text-green-600 mt-1">上传成功</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">点击或拖拽上传</span>
                    </div>
                )}
              </div>
              {errors.tempFilePath && <p className="text-xs text-red-500 mt-2 text-center">请上传 PDF 文件</p>}
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting || !uploadedFile}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 发布中...
              </>
            ) : (
              "立即发布"
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground space-y-2 px-1">
            <p>• 您的账号具有直接发布权限。</p>
            <p>• 提交后文章将直接上线 (Status: PUBLISHED)。</p>
          </div>
        </div>
      </div>
    </div>
  )
}
