
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ExtractedMetadata } from '@/lib/ai-analysis'
import { submitSmartWork } from '../actions'
import { SmartSubmissionSchema, SmartSubmissionData } from '../schema'
import { toast } from "sonner"
import { Loader2, Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Step3Props {
  file: { name: string, tempPath: string }
  metadata: ExtractedMetadata | null
  journal: { id: string, name: string }
  onBack: () => void
}

export function Step3Metadata({ file, metadata, journal, onBack }: Step3Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Initialize state with metadata or defaults
  const [formData, setFormData] = useState<SmartSubmissionData>({
    title: metadata?.title || "",
    description: metadata?.abstract || "",
    type: "NOVEL", // Default to Journal Paper (NOVEL in schema)
    category: "",
    journalId: journal.id,
    tempFilePath: file.tempPath,
    authors: metadata?.authors && metadata.authors.length > 0
      ? metadata.authors.map((name, index) => ({
          name,
          unit: metadata.affiliations?.[index] || "",
          isCorresponding: index === 0, // Default first author as corresponding
          contact: ""
        }))
      : [{ name: "", unit: "", isCorresponding: true, contact: "" }]
  })

  const handleChange = (field: keyof SmartSubmissionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrors({})

    // Client-side Validation
    const result = SmartSubmissionSchema.safeParse(formData)
    
    if (!result.success) {
      const formattedErrors: Record<string, string> = {}
      result.error.errors.forEach(err => {
        // Map path to field name. For array items, it might be "authors.0.name"
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
        toast.success("投稿成功！")
        // Redirect to journal home or dashboard
        router.push('/journals') 
      } else {
        toast.error(response.error || "提交失败")
      }
    } catch (error) {
      console.error(error)
      toast.error("网络错误，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">确认投稿信息</h2>
          <p className="text-muted-foreground">AI 已自动提取信息，请您校对补充</p>
        </div>
        <Button variant="outline" onClick={onBack} size="sm" disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 上一步
        </Button>
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
                <Label htmlFor="title">论文标题 <span className="text-red-500">*</span></Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>投稿期刊</Label>
                  <div className="p-2 border rounded-md bg-muted text-muted-foreground">
                    {journal.name}
                  </div>
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="description">摘要 (Abstract) <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={`min-h-[150px] ${errors.description ? "border-red-500" : ""}`}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>作者信息</CardTitle>
              <Button size="sm" variant="outline" onClick={addAuthor}>
                <Plus className="h-4 w-4 mr-2" /> 添加作者
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {errors.authors && <p className="text-sm text-red-500 mb-2">{errors.authors}</p>}
              
              {formData.authors.map((author, index) => (
                <div key={index} className="relative p-4 border rounded-md bg-card space-y-4">
                   <div className="flex justify-between items-center">
                      <Label className="text-muted-foreground">第 {index + 1} 作者</Label>
                      {formData.authors.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAuthor(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label>姓名 <span className="text-red-500">*</span></Label>
                       <Input 
                          value={author.name} 
                          onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                          className={errors[`authors.${index}.name`] ? "border-red-500" : ""}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>单位</Label>
                       <Input 
                          value={author.unit || ''} 
                          onChange={(e) => handleAuthorChange(index, 'unit', e.target.value)}
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
                        <Label htmlFor={`cor-${index}`} className="cursor-pointer">通讯作者</Label>
                      </div>
                      
                      {author.isCorresponding && (
                        <div className="flex-1">
                          <Input 
                            placeholder="联系方式 (邮箱/手机/ID) *" 
                            value={author.contact || ''}
                            onChange={(e) => handleAuthorChange(index, 'contact', e.target.value)}
                            className={errors[`authors.${index}.contact`] || errors.authors ? "border-red-500" : ""}
                          />
                        </div>
                      )}
                   </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>文件预览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded bg-muted/20 flex flex-col items-center text-center gap-2">
                <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded flex items-center justify-center font-bold text-lg">
                  {file.name.split('.').pop()?.toUpperCase()}
                </div>
                <div className="text-sm font-medium break-all">{file.name}</div>
                <div className="text-xs text-muted-foreground">已准备好提交</div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 提交中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> 确认并提交
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground px-4">
            点击提交即表示您同意我们的投稿协议，并确认上述信息的真实性。
          </p>
        </div>
      </div>
    </div>
  )
}
