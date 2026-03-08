'use client'

import { useActionState, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { submitAwardApplication, FormState } from "./actions"
import { searchPapers } from "./search-action"
import { Search, X, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Cycle {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: string
}

interface Track {
  id: string
  name: string
  description: string | null
  journals?: { id: string; name: string }[]
}

interface Award {
  id: string
  name: string
  cycles: Cycle[]
  tracks: Track[]
}

interface Journal {
  id: string
  name: string
}

interface ApplicationFormProps {
  awards: Award[]
  journals: Journal[]
  defaultAwardId?: string
}

const initialState: FormState = {
  error: null,
  success: false
}

export function ApplicationForm({ awards, journals, defaultAwardId }: ApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(submitAwardApplication, initialState)
  const router = useRouter()
  
  // Form State
  const [selectedAwardId, setSelectedAwardId] = useState(defaultAwardId || "")
  const [selectedTrackId, setSelectedTrackId] = useState("")
  const [nomineeType, setNomineeType] = useState("INDIVIDUAL")
  
  // Paper Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<{id: string, title: string, author: string, source: string}[]>([])
  const [selectedPapers, setSelectedPapers] = useState<{id: string, title: string, source: string}[]>([])

  // Derived State
  const selectedAward = awards.find(a => a.id === selectedAwardId)
  const selectedTrack = selectedAward?.tracks.find(t => t.id === selectedTrackId)
  const availableCycles = selectedAward?.cycles || []
  const availableTracks = selectedAward?.tracks || []
  
  // 根据赛道筛选期刊
  const availableJournals = (selectedTrack && selectedTrack.journals && selectedTrack.journals.length > 0)
    ? selectedTrack.journals
    : (journals || [])

  useEffect(() => {
    if (state.success) {
      toast.success("奖项申请已提交！")
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
    setSearchResults([])
    setSearchQuery("")
  }

  const removePaper = (id: string) => {
    setSelectedPapers(selectedPapers.filter(p => p.id !== id))
  }

  // 检查是否有开放的周期
  const hasOpenCycle = availableCycles.some(c => c.status === 'OPEN')

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
          {/* 奖项选择 */}
          <div className="space-y-2">
            <Label htmlFor="awardId">申请奖项 <span className="text-red-500">*</span></Label>
            <Select 
              name="awardId" 
              value={selectedAwardId}
              onValueChange={(value) => {
                setSelectedAwardId(value)
                setSelectedTrackId("")
              }}
            >
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

          {/* 周期选择 */}
          {selectedAward && (
            <div className="space-y-2">
              <Label htmlFor="cycleId">申请周期 <span className="text-red-500">*</span></Label>
              {availableCycles.length > 0 ? (
                <Select name="cycleId">
                  <SelectTrigger>
                    <SelectValue placeholder="请选择申请周期" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.name} 
                        {cycle.status === 'OPEN' 
                          ? ' (进行中)' 
                          : ` (${new Date(cycle.startDate).toLocaleDateString()} 开始)`
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    该奖项暂无开放的申请周期
                  </AlertDescription>
                </Alert>
              )}
              {state.error && typeof state.error !== 'string' && state.error.cycleId && (
                <p className="text-sm text-red-500">{state.error.cycleId[0]}</p>
              )}
            </div>
          )}

          {/* 赛道选择 */}
          {selectedAward && availableTracks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="trackId">申请赛道 <span className="text-red-500">*</span></Label>
              <Select 
                name="trackId" 
                value={selectedTrackId}
                onValueChange={setSelectedTrackId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择申请赛道" />
                </SelectTrigger>
                <SelectContent>
                  {availableTracks.map((track) => (
                    <SelectItem key={track.id} value={track.id}>
                      {track.name}
                      {track.journals && track.journals.length > 0 && ` (${track.journals.length}个期刊)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTrack?.description && (
                <p className="text-xs text-muted-foreground">{selectedTrack.description}</p>
              )}
              {state.error && typeof state.error !== 'string' && state.error.trackId && (
                <p className="text-sm text-red-500">{state.error.trackId[0]}</p>
              )}
            </div>
          )}

          {/* 被提名者类型 */}
          <div className="space-y-2">
            <Label>被提名者类型 <span className="text-red-500">*</span></Label>
            <RadioGroup 
              name="nomineeType" 
              value={nomineeType}
              onValueChange={(value) => {
                setNomineeType(value)
                // 切换类型时清空之前的选择
                if (value !== 'JOURNAL') {
                  setSelectedTrackId("")
                }
              }}
              className="flex gap-4 flex-wrap"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INDIVIDUAL" id="individual" />
                <Label htmlFor="individual" className="cursor-pointer">个人</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="TEAM" id="team" />
                <Label htmlFor="team" className="cursor-pointer">团队</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="JOURNAL" id="journal" />
                <Label htmlFor="journal" className="cursor-pointer">期刊</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 被提名者姓名/名称 */}
          {nomineeType !== 'JOURNAL' ? (
            <div className="space-y-2">
              <Label htmlFor="nomineeName">
                {nomineeType === 'TEAM' ? '团队名称' : '被提名人姓名'} 
                <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="nomineeName" 
                name="nomineeName" 
                placeholder={nomineeType === 'TEAM' ? "请输入团队名称" : "请输入姓名"} 
                required 
              />
              {state.error && typeof state.error !== 'string' && state.error.nomineeName && (
                <p className="text-sm text-red-500">{state.error.nomineeName[0]}</p>
              )}
            </div>
          ) : (
            /* 被提名期刊选择 */
            <div className="space-y-2">
              <Label htmlFor="journalId">被提名期刊 <span className="text-red-500">*</span></Label>
              <Select name="journalId" required>
                <SelectTrigger>
                  <SelectValue placeholder="请选择被提名的期刊" />
                </SelectTrigger>
                <SelectContent>
                  {availableJournals.map((journal) => (
                    <SelectItem key={journal.id} value={journal.id}>
                      {journal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                选择要被提名的期刊
              </p>
              {state.error && typeof state.error !== 'string' && state.error.journalId && (
                <p className="text-sm text-red-500">{state.error.journalId[0]}</p>
              )}
            </div>
          )}

          {/* 关联代表作 */}
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

          {/* 申请理由 */}
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
            <Button 
              type="submit" 
              disabled={isPending || !hasOpenCycle}
            >
              {isPending ? "提交中..." : "提交申请"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
