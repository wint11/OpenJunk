'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { searchPapers } from "../../actions"
import { Search, Loader2, X, FileText, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

interface Paper {
  id: string
  title: string
  author: string
  journal?: { name: string } | null
}

export function PaperSearch({ onSelect }: { onSelect: (papers: Paper[]) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Paper[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPapers, setSelectedPapers] = useState<Paper[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch() {
    if (!query) return
    setLoading(true)
    setHasSearched(true)
    try {
      // @ts-ignore
      const data = await searchPapers(query)
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(paper: Paper) {
    const isSelected = selectedPapers.some(p => p.id === paper.id)
    let newSelected
    if (isSelected) {
      newSelected = selectedPapers.filter(p => p.id !== paper.id)
    } else {
      newSelected = [...selectedPapers, paper]
    }
    setSelectedPapers(newSelected)
    onSelect(newSelected)
  }

  return (
    <div className="space-y-4 border rounded-md p-4 bg-muted/10">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">关联本站论文 (可选)</Label>
        <div className="flex gap-2">
            <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="输入关键词搜索已发表论文..." 
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
            />
            <Button type="button" onClick={handleSearch} disabled={loading} variant="secondary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
        </div>
      </div>
      
      {/* Selected Papers */}
      {selectedPapers.length > 0 && (
        <div className="flex flex-wrap gap-2">
            {selectedPapers.map(p => (
                <Badge key={p.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                    <span className="truncate max-w-[200px]" title={p.title}>{p.title}</span>
                    <button type="button" onClick={() => toggleSelect(p)} className="ml-1 hover:text-destructive rounded-full p-0.5 hover:bg-muted">
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto bg-background">
            {results.length > 0 ? results.map(paper => {
                const isSelected = selectedPapers.some(p => p.id === paper.id)
                return (
                    <div 
                        key={paper.id} 
                        className={`p-3 text-sm flex items-start gap-3 cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleSelect(paper)}
                    >
                        <div className={`mt-1 h-4 w-4 border rounded flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{paper.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                                {paper.author} · {paper.journal?.name || "OpenJunk"}
                            </div>
                        </div>
                    </div>
                )
            }) : (
                <div className="text-sm text-muted-foreground text-center py-4">未找到相关论文</div>
            )}
        </div>
      )}
    </div>
  )
}
