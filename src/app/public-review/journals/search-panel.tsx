'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, FileText, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { searchNovels, verifyAuthorship } from "./actions"
import Link from "next/link"
import { toast } from "sonner"

interface SearchPanelProps {
  initialIpMatches: { id: string, title: string }[]
}

export function SearchPanel({ initialIpMatches }: SearchPanelProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Verification Dialog State
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [verifyInput, setVerifyInput] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [currentVerifyId, setCurrentVerifyId] = useState<string | null>(null)
  
  // IP Match handling
  useEffect(() => {
    if (initialIpMatches.length > 0) {
      setVerifyOpen(true)
      setCurrentVerifyId(initialIpMatches[0].id) // Verify the first one for now
    }
  }, [initialIpMatches])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setLoading(true)
    setHasSearched(true)
    try {
      const data = await searchNovels(query)
      setResults(data)
    } catch (error) {
      toast.error("搜索失败")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!currentVerifyId || !verifyInput) return
    
    setVerifying(true)
    try {
      const res = await verifyAuthorship(currentVerifyId, verifyInput)
      if (res.success && res.novel) {
        toast.success("验证成功")
        setVerifyOpen(false)
        // Add to results or redirect?
        // Let's add to results so user can see it
        setResults(prev => [
            ...prev.filter(p => p.id !== res.novel!.id), // Deduplicate
            {
                id: currentVerifyId,
                title: res.novel!.title,
                author: res.novel!.author,
                createdAt: new Date(), // Mock or fetch real
                verified: true
            }
        ])
        setHasSearched(true)
      } else {
        toast.error(res.message || "验证失败")
      }
    } catch (error) {
      toast.error("验证出错")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-4">
        <Input 
          placeholder="请输入完整论文标题..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          搜索
        </Button>
      </form>

      {/* Results */}
      {hasSearched && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.length > 0 ? (
            results.map((paper) => (
              <Card key={paper.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge variant="secondary">
                      {paper.verified ? "已验证" : "待审阅"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {paper.createdAt ? new Date(paper.createdAt).toLocaleDateString() : '刚刚'}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2 leading-tight">
                    <Link href={`/public-review/journals/${paper.id}`} className="hover:underline">
                      {paper.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    {paper.author}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>期刊:</span>
                      <span className="font-medium truncate max-w-[150px]">
                        {paper.journal?.name || "未知"}
                      </span>
                    </div>
                    {paper.uploader && (
                        <div className="flex items-center justify-between">
                        <span>上传者:</span>
                        <span className="font-medium truncate max-w-[150px]">
                            {paper.uploader.name}
                        </span>
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
              <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
              未找到匹配的待审论文，请尝试输入更完整的标题。
            </div>
          )}
        </div>
      )}

      {/* Verification Dialog */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>检测到相关投稿</DialogTitle>
            <DialogDescription>
              系统检测到当前 IP ({initialIpMatches.length} 篇) 提交了待审论文。
              为了保护隐私，请验证您的身份以查看详情。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">待验证论文:</div>
              <div className="font-mono text-sm bg-muted p-2 rounded truncate">
                {/* Masked Title logic could be here, but for now assuming user knows what they submitted */}
                {initialIpMatches.find(m => m.id === currentVerifyId)?.title || "未知论文"}
              </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-sm font-medium">验证信息</label>
                <Input 
                    placeholder="请输入第一作者姓名 或 完整论文标题" 
                    value={verifyInput}
                    onChange={(e) => setVerifyInput(e.target.value)}
                />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyOpen(false)}>取消</Button>
            <Button onClick={handleVerify} disabled={verifying}>
              {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              验证并查看
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
