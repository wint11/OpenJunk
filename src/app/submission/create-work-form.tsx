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

interface FundApplication {
  id: string
  title: string
  serialNo: string | null
}

interface CreateWorkFormProps {
  journals: Journal[]
  fundApplications?: FundApplication[]
  isLoggedIn?: boolean
}

const initialState: FormState = {
  error: null,
}

export function CreateWorkForm({ journals, fundApplications = [], isLoggedIn = false }: CreateWorkFormProps) {
  const [state, formAction, isPending] = useActionState(createWork, initialState)
  const [authors, setAuthors] = useState<{ name: string; unit: string; roles: string[]; contact?: string }[]>([
    { name: "", unit: "", roles: [] }
  ])
  const [selectedJournals, setSelectedJournals] = useState<string[]>([])

  const addAuthor = () => {
    setAuthors([...authors, { name: "", unit: "", roles: [] }])
  }

  const removeAuthor = (index: number) => {
    if (authors.length <= 1) return // Prevent removing the last author
    const newAuthors = [...authors]
    newAuthors.splice(index, 1)
    setAuthors(newAuthors)
  }

  const updateAuthor = (index: number, field: 'name' | 'unit' | 'contact', value: string) => {
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

  const handleJournalChange = (journalId: string, checked: boolean) => {
    // Determine limit based on login status
    // If logged in: limit is 1
    // If guest: limit is 3
    const limit = isLoggedIn ? 1 : 3

    if (checked) {
      if (selectedJournals.length >= limit) {
        // If limit is 1, replace the selection
        if (limit === 1) {
            setSelectedJournals([journalId])
            return
        }
        return // Limit reached for guest
      }
      setSelectedJournals([...selectedJournals, journalId])
    } else {
      setSelectedJournals(selectedJournals.filter(id => id !== journalId))
    }
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

             {/* Top Section: Journal, Paper Type, Category */}
             <div className="grid gap-6 md:grid-cols-2">
               {/* Journal Selection - Multiple */}
               <div className="space-y-2 col-span-2">
                 <Label htmlFor="journalIds">投稿期刊 (Submission Journals) <span className="text-red-500">*</span></Label>
                 <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                    {journals.map((journal) => {
                      const isChecked = selectedJournals.includes(journal.id)
                      const limit = isLoggedIn ? 1 : 3
                      // If limit is 1, don't disable other options, allow switching. 
                      // If limit > 1, disable when full.
                      const isDisabled = limit > 1 && !isChecked && selectedJournals.length >= limit
                      
                      return (
                        <div key={journal.id} className="flex items-center space-x-2">
                            <input 
                                type={isLoggedIn ? "radio" : "checkbox"} 
                                id={`journal-${journal.id}`} 
                                name="journalIds" 
                                value={journal.id}
                                checked={isChecked}
                                onChange={(e) => handleJournalChange(journal.id, e.target.checked)}
                                disabled={isDisabled}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label htmlFor={`journal-${journal.id}`} className={`text-sm select-none ${isDisabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}>
                                {journal.name}
                            </label>
                        </div>
                      )
                    })}
                 </div>
                 <p className="text-xs text-muted-foreground">
                    {isLoggedIn 
                        ? "快速通道投稿仅支持选择一个所属期刊。" 
                        : "请选择要投稿的期刊，支持一稿多投（最多选择3个）。"
                    } 
                    已选: {selectedJournals.length}/{isLoggedIn ? 1 : 3}
                 </p>
                 {state.error && typeof state.error === 'object' && state.error.journalIds && (
                   <p className="text-sm text-red-500">{state.error.journalIds[0]}</p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label htmlFor="type">论文类型 <span className="text-red-500">*</span></Label>
                 <Select name="type" required defaultValue="NOVEL" disabled>
                   <SelectTrigger>
                     <SelectValue placeholder="选择类型" />
                   </SelectTrigger>
                   <SelectContent>
                    <SelectItem value="NOVEL">期刊论文 (Journal Paper)</SelectItem>
                  </SelectContent>
                 </Select>
                 {/* Hidden input to ensure value is submitted even when disabled */}
                 <input type="hidden" name="type" value="NOVEL" />
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="category">学科分类 <span className="text-red-500">*</span></Label>
                 <Input id="category" name="category" placeholder="例如：计算机科学、人工智能" required />
                 {state.error && typeof state.error === 'object' && state.error.category && (
                   <p className="text-sm text-red-500">{state.error.category[0]}</p>
                 )}
               </div>
             </div>

             {/* Basic Info */}
             <div className="space-y-2">
               <Label htmlFor="title">论文标题 <span className="text-red-500">*</span></Label>
               <Input id="title" name="title" placeholder="请输入论文标题" required />
               {state.error && typeof state.error === 'object' && state.error.title && (
                 <p className="text-sm text-red-500">{state.error.title[0]}</p>
               )}
             </div>

             {/* Fund Application Selection - Multiple */}
             {fundApplications.length > 0 && (
               <div className="space-y-2">
                 <Label htmlFor="fundApplicationIds">关联基金项目 <span className="text-xs text-muted-foreground font-normal">(选填，支持多选)</span></Label>
                 <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                    {fundApplications.map((app) => (
                        <div key={app.id} className="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                id={`fund-${app.id}`} 
                                name="fundApplicationIds" 
                                value={app.id}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`fund-${app.id}`} className="text-sm cursor-pointer select-none">
                                <span className="font-medium">[{app.serialNo || '无编号'}]</span> {app.title}
                            </label>
                        </div>
                    ))}
                 </div>
                 <p className="text-xs text-muted-foreground">请选择您已立项的基金项目进行关联（仅显示已立项项目）。</p>
               </div>
             )}

             {/* Authors Section - Redesigned */}
             <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label>作者信息 (Authors) <span className="text-red-500">*</span></Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAuthor}>
                    <Plus className="h-4 w-4 mr-2" /> 添加作者
                  </Button>
                </div>
                {state.error && typeof state.error === 'object' && state.error.author && (
                  <p className="text-sm text-red-500 px-1">{state.error.author[0]}</p>
                )}
                {state.error && typeof state.error === 'object' && state.error.correspondingAuthor && (
                  <p className="text-sm text-red-500 px-1">{state.error.correspondingAuthor[0]}</p>
                )}
                
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
                            placeholder="例如：北京大学"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2 flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
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
                        
                        {/* Conditional Contact Input for Corresponding Author */}
                        {author.roles.includes("通讯作者") && (
                          <div className="flex-1 min-w-[200px]">
                             <Input 
                               placeholder="小红书ID 或 邮箱 (必填)" 
                               value={author.contact || ''}
                               onChange={(e) => updateAuthor(index, 'contact', e.target.value)}
                               required
                               className="h-8 text-sm"
                             />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
