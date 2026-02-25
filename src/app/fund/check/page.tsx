'use client'

import { useState, useActionState } from "react"
import { queryApplication } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search, Loader2, FileText, User, Calendar, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

const initialState = {
  success: false,
  message: "",
  data: null
}

export default function CheckStatusPage() {
  const [state, formAction, isPending] = useActionState(queryApplication, initialState)

  const handleSubmit = async (formData: FormData) => {
    await formAction(formData)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="secondary">草稿</Badge>
      case 'SUBMITTED': return <Badge className="bg-blue-500 hover:bg-blue-600">已提交</Badge>
      case 'UNDER_REVIEW': return <Badge className="bg-yellow-500 hover:bg-yellow-600">评审中</Badge>
      case 'REJECTED': return <Badge variant="destructive">未获资助</Badge>
      case 'APPROVED': return <Badge className="bg-green-600 hover:bg-green-700">已立项</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-16 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">申请状态查询</h1>
        <p className="text-muted-foreground">请输入您的申请编号 (Serial No) 查询评审进度。</p>
      </div>

      <Card className="mb-8 shadow-md border-muted/60">
        <CardHeader>
          <CardTitle className="text-lg">查询条件</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="serialNo" className="sr-only">申请编号</Label>
              <Input 
                id="serialNo" 
                name="serialNo" 
                placeholder="例如: 2026-NSFC-123456" 
                required 
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-11 px-8 font-medium" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              查询
            </Button>
          </form>
        </CardContent>
      </Card>

      {state?.message && !state.success && (
        <Alert variant="destructive" className="mb-8 animate-in fade-in zoom-in-95 duration-300">
          <AlertTitle>查询失败</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state?.success && state.data && (
        <Card className="shadow-lg border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <CardTitle className="text-xl font-bold mb-1">{state.data.title}</CardTitle>
                <CardDescription className="text-primary/80 font-medium">{state.data.fundName}</CardDescription>
              </div>
              <div className="self-start">
                {getStatusBadge(state.data.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-background/50 p-4 rounded-lg border border-primary/10">
              <div className="flex items-center text-muted-foreground">
                <User className="h-4 w-4 mr-2 text-primary" />
                <span>申请人: <span className="text-foreground font-medium ml-1">{state.data.applicantName}</span></span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Tag className="h-4 w-4 mr-2 text-primary" />
                <span>类别: <span className="text-foreground font-medium ml-1">{state.data.category}</span></span>
              </div>
              <div className="flex items-center text-muted-foreground sm:col-span-2">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                <span>提交时间: <span className="text-foreground font-medium ml-1">{format(new Date(state.data.submittedAt), 'yyyy-MM-dd HH:mm')}</span></span>
              </div>
            </div>

            {state.data.feedback && (
              <div className="pt-4 border-t border-primary/10">
                <h4 className="font-semibold mb-3 flex items-center text-foreground">
                  <FileText className="h-4 w-4 mr-2 text-primary" /> 评审反馈
                </h4>
                <div className="bg-background p-4 rounded-md text-sm text-muted-foreground border border-border/60 leading-relaxed shadow-sm">
                  {state.data.feedback}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
