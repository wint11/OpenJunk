export interface NewsItem {
  id: string
  content: string
  priority?: number
  active?: boolean
  createdAt?: Date
  link?: string
}

export const defaultNewsItems: NewsItem[] = [
  {
    id: "1",
    content: "OpenJunk 首届 '乱讲PPT大赛' 将于3月16日正式开赛，点此进入",
    priority: 1,
    active: true,
    createdAt: new Date("2026-03-07"),
    link: "/ppt-contest-1"
  }
]

// 获取活跃的新闻消息（按优先级排序）
export function getActiveNews(): NewsItem[] {
  return defaultNewsItems
    .filter(item => item.active)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999))
}

// 添加新的新闻消息
export function addNewsItem(content: string, priority?: number): NewsItem {
  const newItem: NewsItem = {
    id: Date.now().toString(),
    content,
    priority: priority || 999,
    active: true,
    createdAt: new Date()
  }
  
  defaultNewsItems.push(newItem)
  return newItem
}

// 禁用新闻消息
export function disableNewsItem(id: string): boolean {
  const item = defaultNewsItems.find(item => item.id === id)
  if (item) {
    item.active = false
    return true
  }
  return false
}