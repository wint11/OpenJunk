"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  User,
  Calendar,
  Search,
  Star,
  Heart,
  BookOpen
} from "lucide-react"
import { toast } from "sonner"
import { getStories, reviewStory, featureStory } from "./actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface Story {
  id: string
  title: string
  content: string
  category: string
  authorName: string
  authorEmail: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  likes: number
  views: number
  isFeatured: boolean
  createdAt: Date
  reviewedAt: Date | null
  reviewNote: string | null
}

export default function StoriesAdminPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)

  useEffect(() => {
    loadStories()
  }, [filter])

  async function loadStories() {
    setLoading(true)
    const result = await getStories(filter === "ALL" ? undefined : filter)
    if (result.success && result.data) {
      setStories(result.data)
    } else {
      toast.error(result.error || "加载失败")
    }
    setLoading(false)
  }

  const handleReview = async (action: "APPROVE" | "REJECT") => {
    if (!selectedStory) return
    setIsReviewing(true)
    const result = await reviewStory(selectedStory.id, action, reviewNote)
    if (result.success) {
      toast.success(action === "APPROVE" ? "已通过" : "已拒绝")
      setSelectedStory(null)
      setReviewNote("")
      loadStories()
    } else {
      toast.error(result.error || "操作失败")
    }
    setIsReviewing(false)
  }

  const handleFeature = async (story: Story) => {
    const result = await featureStory(story.id, !story.isFeatured)
    if (result.success) {
      toast.success(story.isFeatured ? "已取消精选" : "已设为精选")
      loadStories()
    } else {
      toast.error(result.error || "操作失败")
    }
  }

  const filteredStories = stories.filter(story => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      story.title.toLowerCase().includes(query) ||
      story.authorName.toLowerCase().includes(query) ||
      story.content.toLowerCase().includes(query)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200"><Clock className="w-3 h-3 mr-1" />待审阅</Badge>
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />已通过</Badge>
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" />已拒绝</Badge>
      default:
        return null
    }
  }

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      TRACE: "迹",
      CROSS: "渡",
      LIGHT: "光",
      UNFINISHED: "未",
    }
    return names[category] || category
  }

  const stats = [
    { label: "全部", count: stories.length, filter: "ALL" as const },
    { label: "待审阅", count: stories.filter(s => s.status === "PENDING").length, filter: "PENDING" as const },
    { label: "已通过", count: stories.filter(s => s.status === "APPROVED").length, filter: "APPROVED" as const },
    { label: "已拒绝", count: stories.filter(s => s.status === "REJECTED").length, filter: "REJECTED" as const },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="w-8 h-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold">故事审阅</h1>
          <p className="text-muted-foreground">审阅用户投稿的故事，管理精选内容</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((item) => (
          <Card 
            key={item.filter}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              filter === item.filter && "border-orange-300 ring-2 ring-orange-100"
            )}
            onClick={() => setFilter(item.filter)}
          >
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{item.count}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 搜索 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索标题、作者或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 故事列表 */}
      <Card>
        <CardHeader>
          <CardTitle>故事列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无故事</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>故事</TableHead>
                  <TableHead>栏目</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>数据</TableHead>
                  <TableHead>投稿时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStories.map((story) => (
                  <TableRow key={story.id}>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium line-clamp-1">{story.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {story.content.slice(0, 50)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {getCategoryName(story.category)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-3 h-3" />
                        {story.authorName}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(story.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {story.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {story.likes}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(story.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStory(story)}
                        >
                          查看
                        </Button>
                        {story.status === "APPROVED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeature(story)}
                            className={story.isFeatured ? "text-orange-500" : ""}
                          >
                            <Star className={cn("w-4 h-4 mr-1", story.isFeatured && "fill-current")} />
                            {story.isFeatured ? "精选" : "精选"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 审阅弹窗 */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedStory?.title}</DialogTitle>
          </DialogHeader>
          {selectedStory && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{getCategoryName(selectedStory.category)}</span>
                <span>·</span>
                <span>{selectedStory.authorName}</span>
                <span>·</span>
                <span>{new Date(selectedStory.createdAt).toLocaleDateString("zh-CN")}</span>
              </div>
              
              <div className="max-h-[40vh] overflow-y-auto border rounded-lg p-4 bg-muted/30">
                <div className="prose prose-sm max-w-none">
                  {selectedStory.content.split("\n").map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {selectedStory.status === "PENDING" ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="审阅意见（可选）..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleReview("REJECT")}
                      disabled={isReviewing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      拒绝
                    </Button>
                    <Button
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      onClick={() => handleReview("APPROVE")}
                      disabled={isReviewing}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      通过
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm">
                    <span className="font-medium">审阅状态：</span>
                    {selectedStory.status === "APPROVED" ? "已通过" : "已拒绝"}
                  </p>
                  {selectedStory.reviewNote && (
                    <p className="text-sm mt-2">
                      <span className="font-medium">审阅意见：</span>
                      {selectedStory.reviewNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
