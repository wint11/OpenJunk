'use client'

import { useActionState, useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createChapter, ChapterFormState } from "./actions"

const initialState: ChapterFormState = {
  error: null,
}

export default function NewChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [state, formAction, isPending] = useActionState(createChapter, initialState)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <h1 className="text-3xl font-bold tracking-tight">发布新内容</h1>
       <Card>
         <CardHeader>
           <CardTitle>内容详情</CardTitle>
           <CardDescription>填写标题和正文</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <form action={formAction} className="space-y-4">
             <input type="hidden" name="novelId" value={id} />
             <div className="space-y-2">
               <Label htmlFor="title">标题</Label>
               <Input
                 id="title"
                 name="title"
                 placeholder="例如：摘要、引言、结论等"
                 required
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
               />
               {state.error && typeof state.error === 'object' && state.error.title && (
                 <p className="text-sm text-red-500">{state.error.title[0]}</p>
               )}
             </div>
             <div className="space-y-2">
               <Label htmlFor="content">正文内容</Label>
               <Textarea
                 id="content"
                 name="content"
                 placeholder="请输入正文内容..."
                 className="h-96 font-mono"
                 required
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
               />
               {state.error && typeof state.error === 'object' && state.error.content && (
                 <p className="text-sm text-red-500">{state.error.content[0]}</p>
               )}
             </div>
             <div className="flex items-center space-x-2">
               <input
                 type="checkbox"
                 id="isVip"
                 name="isVip"
                 className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
               />
               <Label htmlFor="isVip">设置为会员专享内容</Label>
             </div>
             {state.error && typeof state.error === 'string' && (
               <p className="text-sm text-red-500">{state.error}</p>
             )}
             <Button className="w-full" type="submit" disabled={isPending}>
               {isPending ? "发布中..." : "发布内容"}
             </Button>
           </form>
         </CardContent>
       </Card>
    </div>
  )
}
