"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Megaphone, Plus, Trash2, Edit2 } from "lucide-react"
import { toast } from "sonner"
import {
  getAllNews,
  createNews,
  updateNews,
  deleteNews,
  toggleNewsStatus,
  updateNewsOrder
} from "./actions"

interface NewsItem {
  id: string
  content: string
  link: string | null
  priority: number
  active: boolean
  createdAt: Date
}

export default function NewsAdminPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    content: "",
    link: "",
    priority: "1",
    active: true
  })

  // 加载数据
  useEffect(() => {
    loadNews()
  }, [])

  async function loadNews() {
    setLoading(true)
    const result = await getAllNews()
    if (result.success && result.data) {
      setNewsItems(result.data)
    } else {
      toast.error(result.error || "加载失败")
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      toast.error("请输入通知内容")
      return
    }

    const data = {
      content: formData.content,
      link: formData.link,
      priority: parseInt(formData.priority) || 1,
      active: formData.active
    }

    if (isEditing && editingId) {
      const result = await updateNews(editingId, data)
      if (result.success) {
        toast.success("通知已更新")
        await loadNews()
        resetForm()
      } else {
        toast.error(result.error || "更新失败")
      }
    } else {
      const result = await createNews(data)
      if (result.success) {
        toast.success("通知已添加")
        await loadNews()
        resetForm()
      } else {
        toast.error(result.error || "添加失败")
      }
    }
  }

  const resetForm = () => {
    setFormData({ content: "", link: "", priority: "1", active: true })
    setIsEditing(false)
    setEditingId(null)
  }

  const handleEdit = (item: NewsItem) => {
    setIsEditing(true)
    setEditingId(item.id)
    setFormData({
      content: item.content,
      link: item.link || "",
      priority: item.priority.toString(),
      active: item.active
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条通知吗？")) return

    const result = await deleteNews(id)
    if (result.success) {
      toast.success("通知已删除")
      await loadNews()
    } else {
      toast.error(result.error || "删除失败")
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const result = await toggleNewsStatus(id, !currentActive)
    if (result.success) {
      toast.success(!currentActive ? "通知已启用" : "通知已禁用")
      await loadNews()
    } else {
      toast.error(result.error || "操作失败")
    }
  }

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === newsItems.length - 1) return

    const newItems = [...newsItems]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    // 交换位置
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]

    // 更新优先级
    const updatedItems = newItems.map((item, i) => ({
      id: item.id,
      priority: i + 1
    }))

    const result = await updateNewsOrder(updatedItems)
    if (result.success) {
      await loadNews()
    } else {
      toast.error(result.error || "排序失败")
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Megaphone className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">平台通知管理</h1>
          <p className="text-muted-foreground">管理首页轮播通知内容</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 表单区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isEditing ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {isEditing ? "编辑通知" : "添加通知"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">
                  通知内容 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="请输入通知内容..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">链接地址（可选）</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="例如：/ppt-contest-1"
                />
                <p className="text-xs text-muted-foreground">
                  填写后点击通知将跳转到该链接
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="数字越小优先级越高"
                  min={1}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked === true })}
                />
                <Label htmlFor="active">立即启用</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {isEditing ? "更新通知" : "添加通知"}
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    取消
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 列表区域 */}
        <Card>
          <CardHeader>
            <CardTitle>通知列表</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>加载中...</p>
              </div>
            ) : newsItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>暂无通知</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">排序</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead className="w-20">状态</TableHead>
                    <TableHead className="w-32">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsItems.map((item, index) => (
                    <TableRow key={item.id} className={!item.active ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <span className="text-xs text-center">{item.priority}</span>
                          <button
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === newsItems.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate">{item.content}</p>
                          {item.link && (
                            <p className="text-xs text-muted-foreground truncate">
                              链接: {item.link}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={item.active}
                          onCheckedChange={() => handleToggleActive(item.id, item.active)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
