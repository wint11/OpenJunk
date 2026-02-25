'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, Mail } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { handleInvitation, markAllAsRead } from "./actions"

interface Notification {
  id: string
  title: string
  content: string
  type: string
  status: string
  createdAt: Date
  data: string | null
  sender: {
    name: string | null
    email: string
  } | null
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    setItems(notifications)
  }, [notifications])

  useEffect(() => {
    const hasUnread = notifications.some(n => n.status === 'UNREAD')
    if (hasUnread) {
      // Mark all as read when component mounts if there are unread messages
      markAllAsRead()
    }
  }, []) // Empty dependency array means it runs once on mount

  const onHandleInvitation = async (id: string, accept: boolean) => {
    setLoading(id)
    try {
      await handleInvitation(id, accept)
      setItems(items.map(item => 
        item.id === id 
          ? { ...item, status: accept ? 'ACCEPTED' : 'REJECTED' } 
          : item
      ))
    } catch (error) {
      alert("操作失败")
    } finally {
      setLoading(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Mail className="mx-auto h-12 w-12 opacity-20 mb-4" />
        <p>暂无消息</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((notification) => (
        <Card key={notification.id} className={notification.status === 'UNREAD' ? 'border-primary/50 bg-primary/5' : ''}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {notification.type === 'INVITATION' && <Badge variant="outline">邀请</Badge>}
                  {notification.type === 'SYSTEM' && <Badge variant="secondary">系统</Badge>}
                  {notification.type === 'REVIEW' && <Badge>审稿</Badge>}
                  {notification.title}
                </CardTitle>
                <CardDescription>
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: zhCN })}
                  {notification.sender && ` · 来自 ${notification.sender.name || notification.sender.email}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 {notification.status === 'UNREAD' && <Badge variant="default" className="bg-blue-500">未读</Badge>}
                 {notification.status === 'ACCEPTED' && <Badge variant="default" className="bg-green-500">已接受</Badge>}
                 {notification.status === 'REJECTED' && <Badge variant="destructive">已拒绝</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notification.content}</p>
          </CardContent>
          {notification.type === 'INVITATION' && notification.status !== 'ACCEPTED' && notification.status !== 'REJECTED' && (
            <CardFooter className="flex justify-end gap-2 pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onHandleInvitation(notification.id, false)}
                disabled={loading === notification.id}
              >
                <X className="mr-2 h-4 w-4" /> 拒绝
              </Button>
              <Button 
                size="sm" 
                onClick={() => onHandleInvitation(notification.id, true)}
                disabled={loading === notification.id}
              >
                <Check className="mr-2 h-4 w-4" /> 接受
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}
