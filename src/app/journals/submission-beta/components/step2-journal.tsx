
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Sparkles, History, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { getRecommendedJournals, getAllJournals, JournalRecommendation } from '../actions'
import { ExtractedMetadata } from '@/lib/ai-analysis'

interface Step2Props {
  metadata: ExtractedMetadata | null
  onNext: (journal: { id: string, name: string }) => void
  onBack: () => void
}

export function Step2Journal({ metadata, onNext, onBack }: Step2Props) {
  const [recommendations, setRecommendations] = useState<JournalRecommendation[]>([])
  const [allJournals, setAllJournals] = useState<{ id: string, name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch recommendations and all journals in parallel
        const [recs, all] = await Promise.all([
          getRecommendedJournals(metadata?.journalName),
          getAllJournals()
        ])
        setRecommendations(recs)
        setAllJournals(all)
      } catch (error) {
        console.error("Failed to fetch journals:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [metadata])

  const filteredJournals = allJournals.filter(j => 
    j.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    // Exclude ones already shown in recommendations to avoid duplication visually? 
    // Or keep them. Let's keep them but maybe deemphasize.
    // For simplicity, we just filter by search term.
    true
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">选择投稿期刊</h2>
          <p className="text-muted-foreground">AI 根据您的稿件内容和历史习惯为您推荐</p>
        </div>
        <Button variant="outline" onClick={onBack} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> 上一步
        </Button>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" /> 智能推荐
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.map((journal) => (
              <Card 
                key={journal.id} 
                className="cursor-pointer hover:border-primary hover:bg-primary/5 transition-all border-l-4 border-l-yellow-500 shadow-sm"
                onClick={() => onNext(journal)}
              >
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="font-semibold truncate" title={journal.name}>{journal.name}</div>
                  <div className="flex gap-2">
                    {journal.reason === 'AI_MATCH' && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                        <Sparkles className="w-3 h-3 mr-1" /> AI 匹配
                      </Badge>
                    )}
                    {journal.reason === 'HISTORY' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                        <History className="w-3 h-3 mr-1" /> 常用期刊
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Journals Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> 所有期刊
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜索期刊名称..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 max-h-[400px] overflow-y-auto pr-2">
          {isLoading ? (
             Array.from({ length: 8 }).map((_, i) => (
               <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
             ))
          ) : filteredJournals.length > 0 ? (
            filteredJournals.map((journal) => (
              <div 
                key={journal.id}
                onClick={() => onNext(journal)}
                className="p-3 border rounded-md hover:border-primary hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-2 group"
              >
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium truncate" title={journal.name}>{journal.name}</span>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              未找到匹配的期刊
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
