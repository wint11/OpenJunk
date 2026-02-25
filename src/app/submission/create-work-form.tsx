'use client'

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createWork, FormState } from "./actions"
import { Plus, Trash2 } from "lucide-react"

interface Journal {
  id: string
  name: string
}

interface CreateWorkFormProps {
  journals: Journal[]
  isLoggedIn?: boolean
}

const initialState: FormState = {
  error: null,
}

export function CreateWorkForm({ journals, isLoggedIn = false }: CreateWorkFormProps) {
  const [state, formAction, isPending] = useActionState(createWork, initialState)
  const [authors, setAuthors] = useState<{ name: string; unit: string; roles: string[] }[]>([
    { name: "", unit: "", roles: [] }
  ])

  const addAuthor = () => {
    setAuthors([...authors, { name: "", unit: "", roles: [] }])
  }

  const removeAuthor = (index: number) => {
    if (authors.length <= 1) return // Prevent removing the last author
    const newAuthors = [...authors]
    newAuthors.splice(index, 1)
    setAuthors(newAuthors)
  }

  const updateAuthor = (index: number, field: 'name' | 'unit', value: string) => {
    const newAuthors = [...authors]
    newAuthors[index] = { ...newAuthors[index], [field]: value }
    setAuthors(newAuthors)
  }

  const toggleCorrespondingAuthor = (index: number) => {
    const newAuthors = [...authors]
    const currentRoles = newAuthors[index].roles
    if (currentRoles.includes("通讯作者")) {
      newAuthors[index].roles = currentRoles.filter(r => r !== "通讯作者")
    } else {
      newAuthors[index].roles = [...currentRoles, "通讯作者"]
    }
    setAuthors(newAuthors)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
       <h1 className="text-3xl font-bold tracking-tight">投稿新论文</h1>
       <Card>
         <CardHeader>
           <CardTitle>论文投稿</CardTitle>
           <CardDescription>
             {isLoggedIn 
               ? "您已登录，提交后文章将直接发布到期刊库，无需审核。" 
               : "请填写论文详细信息并提交审核"}
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           {isLoggedIn && (
            <div className="p-3 mb-4 rounded-md bg-green-50 text-green-700 text-sm font-medium border border-green-200">
              ✓ 快速通道已激活：主编/内部人员上传模式（仅显示您管理的或参与的期刊）
            </div>
          )}
          <form action={formAction} className="space-y-6">
             {/* Hidden input to pass authors data */}
             <input type="hidden" name="authorsData" value={JSON.stringify(authors)} />

             {/* Journal Selection - Moved to Top */}
             <div className="space-y-2">
               <Label htmlFor="journalId">投稿期刊 <span className="text-red-500">*</span></Label>
               <Select name="journalId" required>
                 <SelectTrigger>
                   <SelectValue placeholder="选择要投稿的期刊" />
                 </SelectTrigger>
                 <SelectContent position="popper" className="max-h-[300px] overflow-y-auto">
                   {journals.map((journal) => (
                     <SelectItem key={journal.id} value={journal.id}>
                       {journal.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <p className="text-xs text-muted-foreground">请选择最适合您论文主题的期刊。</p>
             </div>

             {/* Basic Info */}
             <div className="space-y-2">
               <Label htmlFor="title">论文标题 <span className="text-red-500">*</span></Label>
               <Input id="title" name="title" placeholder="请输入论文标题" required />
               {state.error && typeof state.error === 'object' && state.error.title && (
                 <p className="text-sm text-red-500">{state.error.title[0]}</p>
               )}
             </div>

             {/* Authors Section - Redesigned */}
             <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label>作者信息 (Authors) <span className="text-red-500">*</span></Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAuthor}>
                    <Plus className="h-4 w-4 mr-2" /> 添加作者
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {authors.map((author, index) => (
                    <div key={index} className="space-y-3 p-4 bg-background rounded-md border relative">
                      <div className="flex justify-between items-start">
                        <Label className="text-sm font-medium text-muted-foreground">
                           第 {index + 1} 作者
                        </Label>
                        {authors.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 -mr-2 -mt-2"
                            onClick={() => removeAuthor(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`author-name-${index}`}>姓名</Label>
                          <Input 
                            id={`author-name-${index}`}
                            value={author.name} 
                            onChange={(e) => updateAuthor(index, 'name', e.target.value)}
                            placeholder="作者姓名"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`author-unit-${index}`}>单位/机构 <span className="text-xs text-muted-foreground font-normal">(选填)</span></Label>
                          <Input 
                            id={`author-unit-${index}`}
                            value={author.unit} 
                            onChange={(e) => updateAuthor(index, 'unit', e.target.value)}
                            placeholder="RedNote xx."
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <input
                          type="checkbox"
                          id={`author-corresponding-${index}`}
                          checked={author.roles.includes("通讯作者")}
                          onChange={() => toggleCorrespondingAuthor(index)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`author-corresponding-${index}`} className="text-sm font-normal cursor-pointer">
                          设置为通讯作者 (Corresponding Author)
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="grid gap-6 md:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="type">论文类型 <span className="text-red-500">*</span></Label>
                 <Select name="type" required defaultValue="NOVEL">
                   <SelectTrigger>
                     <SelectValue placeholder="选择类型" />
                   </SelectTrigger>
                   <SelectContent>
                    <SelectItem value="NOVEL">期刊论文 (Journal Paper)</SelectItem>
                    <SelectItem value="PAPER">会议论文 (Conference Paper)</SelectItem>
                    <SelectItem value="AUTOBIOGRAPHY">技术报告 (Technical Report)</SelectItem>
                    <SelectItem value="ARTICLE">综述文章 (Review Article)</SelectItem>
                  </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="category">学科分类 <span className="text-red-500">*</span></Label>
                 <Input id="category" name="category" placeholder="例如：计算机科学、人工智能" required />
                 {state.error && typeof state.error === 'object' && state.error.category && (
                   <p className="text-sm text-red-500">{state.error.category[0]}</p>
                 )}
               </div>
             </div>

             <div className="space-y-2">
               <Label htmlFor="description">摘要 (Abstract) <span className="text-red-500">*</span></Label>
               <Textarea 
                 id="description" 
                 name="description" 
                 placeholder="请输入论文摘要，简要介绍研究背景、方法、结果和结论..." 
                 className="h-32" 
                 required 
               />
               {state.error && typeof state.error === 'object' && state.error.description && (
                 <p className="text-sm text-red-500">{state.error.description[0]}</p>
               )}
             </div>

             <div className="space-y-2">
               <Label htmlFor="pdfFile">
                 {isLoggedIn ? "上传PDF文件 (Upload PDF)" : "上传稿件文件 (Upload Manuscript)"} <span className="text-red-500">*</span>
               </Label>
               <Input 
                 id="pdfFile" 
                 name="pdfFile" 
                 type="file"
                 accept={isLoggedIn ? ".pdf" : ".docx,.doc,.zip,.rar"}
                 required 
               />
               <p className="text-xs text-muted-foreground">
                 {isLoggedIn 
                   ? "请直接上传PDF文件，文件大小限制在20MB以内。" 
                   : "请上传Word文档(docx/doc)或压缩包(zip/rar，如LaTeX源文件)，文件大小限制在10MB以内。"}
               </p>
               {state.error && typeof state.error === 'object' && state.error.pdfUrl && (
                 <p className="text-sm text-red-500">{state.error.pdfUrl[0]}</p>
               )}
             </div>

             {state.error && typeof state.error === 'string' && (
               <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                 {state.error}
               </div>
             )}
             
             <div className="flex justify-end gap-4 pt-4">
               <Button variant="outline" type="button" onClick={() => window.history.back()}>取消</Button>
               <Button type="submit" disabled={isPending} className="w-32">
                 {isPending ? "处理中..." : (isLoggedIn ? "立即发布" : "提交审核")}
               </Button>
             </div>
           </form>
         </CardContent>
       </Card>
    </div>
  )
}
