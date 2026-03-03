
import { notFound } from "next/navigation"
import { getReviewData, postReviewComment } from "./actions"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Clock, User, CheckCircle2, Upload, AlertCircle, Edit, X, Check } from "lucide-react"
import Link from "next/link"

import { UploadRevisionDialog } from "./upload-revision-dialog"
import { extname } from "path"

interface ReviewDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = await params
  const session = await auth()
  const novel = await getReviewData(id)

  if (!novel) notFound()

  // Verify access? 
  // If it's DRAFT, normally hidden. But if user got here via verification or search, we assume they can view this interaction page.
  // The content of the paper itself (PDF) might still be restricted, but the "Issue" discussion is visible?
  // User requirement: "类似于github issues的设计"
  
  const isAuthor = session?.user?.id === novel.uploaderId
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')
  // const isReviewer = session?.user?.role === 'REVIEWER' || session?.user?.role === 'ADMIN'

  // Check for revision requests
  // Find the last action that was either MINOR or MAJOR revision
  // And ensure it wasn't followed by a REVISION_SUBMITTED action
  // Sort by createdAt descending
  const sortedComments = [...novel.novelReviewComments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const lastRelevantAction = sortedComments.find(c => c.action && ['MINOR_REVISION', 'MAJOR_REVISION', 'REVISION_SUBMITTED', 'APPROVE', 'REJECT'].includes(c.action))?.action
  
  const isRevisionRequested = lastRelevantAction === 'MINOR_REVISION' || lastRelevantAction === 'MAJOR_REVISION'

  // Determine file extension
  const fileExt = novel.pdfUrl ? extname(novel.pdfUrl) : '.pdf'

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8 border-b pb-6">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">
                    {novel.title} 
                    <span className="text-muted-foreground ml-2 font-normal text-2xl">#{novel.id.slice(-4)}</span>
                </h1>
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Badge variant={novel.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {novel.status}
                    </Badge>
                    <span className="flex items-center gap-1">
                        <User className="h-4 w-4" /> {novel.author}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> 于 {new Date(novel.createdAt).toLocaleDateString()} 开启
                    </span>
                    <span>
                        {novel.novelReviewComments.length} 条评论
                    </span>
                </div>
            </div>
            
            {/* Header Right Actions */}
            <div className="flex gap-2">
                {/* Show "Upload Revised Paper" if revision requested */}
                {/* Allow ANYONE who can access this page to upload if it's in revision state */}
                {/* This is per user request: "能看到这个界面...都允许上传" */}
                {isRevisionRequested && (
                    <UploadRevisionDialog 
                        novelId={novel.id} 
                        accept={fileExt}
                        trigger={
                            <Button variant="default">
                                <Upload className="mr-2 h-4 w-4" />
                                上传修改稿件
                            </Button>
                        }
                    />
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Main Discussion Area */}
        <div className="md:col-span-3 space-y-6">
            {/* Original Post (The Paper Submission) */}
            <div className="border rounded-lg bg-card">
                <div className="bg-muted/30 p-3 border-b flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={novel.uploader?.image || ""} />
                            <AvatarFallback>{novel.uploader?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{novel.uploader?.name}</span>
                        <span className="text-muted-foreground">提交了论文</span>
                    </div>
                    <span className="text-muted-foreground">{new Date(novel.createdAt).toLocaleString()}</span>
                </div>
                <div className="p-6 prose dark:prose-invert max-w-none">
                    <p>{novel.description || "无描述"}</p>
                </div>
            </div>

            {/* Timeline / Comments */}
            {novel.novelReviewComments.map((comment) => {
                let ActionIcon = MessageSquare
                let actionColor = "text-muted-foreground"
                // Default action label based on login status
                // If user is logged in (has userId), they "post" reviews
                // If user is anonymous (no userId), they "reply" to reviews
                const isLoggedIn = !!comment.userId
                let actionLabel = isLoggedIn ? "发布了评审意见" : "回复了评审意见"
                
                if (comment.action === 'REJECT') {
                    ActionIcon = X
                    actionColor = "text-destructive"
                    actionLabel = "拒绝了稿件"
                } else if (comment.action === 'MINOR_REVISION') {
                    ActionIcon = Edit
                    actionColor = "text-orange-500"
                    actionLabel = "要求小修"
                } else if (comment.action === 'MAJOR_REVISION') {
                    ActionIcon = AlertCircle
                    actionColor = "text-red-500"
                    actionLabel = "要求大修"
                } else if (comment.action === 'APPROVE') {
                    ActionIcon = Check
                    actionColor = "text-green-500"
                    actionLabel = "录用了稿件"
                } else if (comment.action === 'REVISION_SUBMITTED') {
                    ActionIcon = Upload
                    actionColor = "text-blue-500"
                    actionLabel = "提交了修改稿"
                }

                return (
                <div key={comment.id} className="flex gap-4">
                    <Avatar className="h-10 w-10 border mt-1">
                        <AvatarImage src={comment.user?.image || ""} />
                        <AvatarFallback>{comment.user?.name?.[0] || "匿"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 border rounded-lg bg-card relative">
                        {/* Triangle arrow */}
                        <div className="absolute top-4 -left-1.5 w-3 h-3 bg-muted/30 border-l border-t transform -rotate-45" />
                        
                        <div className="bg-muted/30 p-3 border-b flex items-center justify-between text-sm rounded-t-lg">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                    {comment.user?.name || comment.guestName || "匿名用户"}
                                </span>
                                {comment.user?.role === 'REVIEWER' && <Badge variant="outline" className="text-[10px] h-5">Reviewer</Badge>}
                                {comment.user?.role === 'ADMIN' && <Badge variant="default" className="text-[10px] h-5">Admin</Badge>}
                                {novel.uploaderId === comment.userId && <Badge variant="secondary" className="text-[10px] h-5">Author</Badge>}
                                <span className="text-muted-foreground flex items-center gap-1">
                                    {actionLabel} 于 {new Date(comment.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="p-4">
                            {comment.action && comment.action !== 'COMMENT' && comment.action !== 'REVISION_SUBMITTED' && (
                                <div className={`flex items-center gap-2 mb-2 font-medium ${actionColor}`}>
                                    <ActionIcon className="h-4 w-4" />
                                    <span>{actionLabel}</span>
                                </div>
                            )}
                            <p className="whitespace-pre-wrap">{comment.content}</p>
                        </div>
                    </div>
                </div>
            )})}

            <Separator className="my-6" />

            {/* Comment Box - Always visible */}
            <div className="flex gap-4">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback>{session?.user?.name?.[0] || "匿"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                    <form action={async (formData) => {
                        'use server'
                        const content = formData.get('content') as string
                        if (!content) return
                        await postReviewComment(id, content)
                    }}>
                        <div className="border rounded-lg bg-background focus-within:ring-1 focus-within:ring-ring">
                            <Textarea 
                                name="content" 
                                placeholder={session?.user ? "留下你的评论..." : "以匿名身份发表评论..."}
                                className="min-h-[150px] border-0 focus-visible:ring-0 resize-y p-4" 
                            />
                            <div className="p-2 flex justify-end bg-muted/10 rounded-b-lg">
                                <Button type="submit" className="gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    回复编辑
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">所属期刊</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="font-semibold">{novel.journal?.name || "未分配"}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">参与者</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {/* Unique participants */}
                        {Array.from(new Set([novel.uploaderId, ...novel.novelReviewComments.map(c => c.userId)])).map(uid => {
                            // Find user info from comments or uploader
                            const user = uid === novel.uploaderId ? novel.uploader : novel.novelReviewComments.find(c => c.userId === uid)?.user
                            if (!user) return null
                            return (
                                <Avatar key={uid} className="h-8 w-8" title={user.name || ""}>
                                    <AvatarImage src={user.image || ""} />
                                    <AvatarFallback>{user.name?.[0] || "?"}</AvatarFallback>
                                </Avatar>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
