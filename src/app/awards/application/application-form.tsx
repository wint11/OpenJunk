'use client'

import { useActionState, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { submitAwardApplication, FormState } from "./actions"
import { searchPapers } from "./search-action"
import { Search, X, Loader2 } from "lucide-react"

interface Award {
  id: string
  name: string
}

interface ApplicationFormProps {
  awards: Award[]
  defaultAwardId?: string
}

const initialState: FormState = {
  error: null,
  success: false
}

export function ApplicationForm({ awards, defaultAwardId }: ApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(submitAwardApplication, initialState)
  const router = useRouter()
  
  // Paper Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<{id: string, title: string, author: string, source: string}[]>([])
  const [selectedPapers, setSelectedPapers] = useState<{id: string, title: string, source: string}[]>([])

  useEffect(() => {
    if (state.success) {
      toast.success("奖项申请已提交！")
      // Redirect or reset
      router.push("/awards")
    }
  }, [state.success, router])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const results = await searchPapers(searchQuery)
      setSearchResults(results)
    } catch (error) {
      toast.error("搜索失败，请稍后重试")
    } finally {
      setIsSearching(false)
    }
  }

  const addPaper = (paper: {id: string, title: string, source: string}) => {
    if (selectedPapers.find(p => p.id === paper.id)) return
    setSelectedPapers([...selectedPapers, paper])
    setSearchResults([]) // Clear results after selection
    setSearchQuery("")
  }

  const removePaper = (id: string) => {
    setSelectedPapers(selectedPapers.filter(p => p.id !== id))
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>奖项申请/提名</CardTitle>
        <CardDescription>
          请填写下方表格以申请或提名OpenJunk学术垃圾奖项。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="awardId">申请奖项 <span className="text-red-500">*</span></Label>
            <Select name="awardId" defaultValue={defaultAwardId}>
              <SelectTrigger>
                <SelectValue placeholder="请选择要申请的奖项" />
              </SelectTrigger>
              <SelectContent>
                {awards.map((award) => (
                  <SelectItem key={award.id} value={award.id}>
                    {award.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.error && typeof state.error !== 'string' && state.error.awardId && (
              <p className="text-sm text-red-500">{state.error.awardId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nomineeName">被提名人/团队姓名 <span className="text-red-500">*</span></Label>
            <Input id="nomineeName" name="nomineeName" placeholder="请输入姓名" required />
            {state.error && typeof state.error !== 'string' && state.error.nomineeName && (
              <p className="text-sm text-red-500">{state.error.nomineeName[0]}</p>
            )}
          </div>



          <div className="space-y-2">
            <Label>关联代表作 <span className="text-xs text-muted-foreground">(从OpenJunk库中选择)</span></Label>
            <div className="flex gap-2 relative">
               <Input 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="搜索论文标题或作者..." 
                 onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearch()
                    }
                 }}
               />
               <Button type="button" variant="outline" size="icon" onClick={handleSearch} disabled={isSearching}>
                 {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
               </Button>

               {/* Search Results Dropdown */}
               {searchResults.length > 0 && (
                 <div className="absolute top-12 left-0 z-50 w-full bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
                   {searchResults.map((paper) => (
                     <div 
                       key={paper.id} 
                       className="p-3 hover:bg-muted cursor-pointer text-sm border-b last:border-0"
                       onClick={() => addPaper(paper)}
                     >
                       <div className="font-medium truncate text-foreground">{paper.title}</div>
                       <div className="text-xs text-muted-foreground flex justify-between mt-1">
                         <span className="truncate max-w-[50%]">{paper.author}</span>
                         <span className="truncate max-w-[40%] text-right">{paper.source}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {/* Selected Papers List */}
            {selectedPapers.length > 0 && (
              <div className="space-y-2 mt-2">
                {selectedPapers.map((paper) => (
                  <div key={paper.id} className="flex items-center justify-between p-2 bg-muted/50 rounded border text-sm">
                    <div className="truncate flex-1 mr-2 flex items-center gap-2">
                      <span className="font-medium truncate">{paper.title}</span>
                      <span className="text-muted-foreground text-xs shrink-0 bg-background px-1 rounded border">{paper.source}</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => removePaper(paper.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <input type="hidden" name="paperIds" value={selectedPapers.map(p => p.id).join(',')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workDescription">申请理由/成果描述 <span className="text-xs text-muted-foreground">(选填)</span></Label>
            <Textarea 
              id="workDescription" 
              name="workDescription" 
              placeholder="请简述申请理由或成果的垃圾程度..." 
              rows={5}
            />
            {state.error && typeof state.error !== 'string' && state.error.workDescription && (
              <p className="text-sm text-red-500">{state.error.workDescription[0]}</p>
            )}
          </div>

          {state.error && typeof state.error === 'string' && (
            <div className="text-sm text-red-500">{state.error}</div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "提交中..." : "提交申请"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
