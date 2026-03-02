'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { voteAoi, triggerAoiCalculation } from "./actions"
import { Activity, Zap, ThumbsUp, ThumbsDown, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AoiDisplayProps {
  novelId: string
  aoiScore: number
  aiScores: {
    rigor: number
    reproducibility: number
    standardization: number
    professionalism: number
    objectivity: number
  }
  userVote?: 'OVERREACH' | 'MISCONDUCT' | null
  isDuplicate?: boolean
}

export function AoiDisplay({ novelId, aoiScore, aiScores, userVote, isDuplicate }: AoiDisplayProps) {
  const [isPending, startTransition] = useTransition()
  const [currentVote, setCurrentVote] = useState(userVote)
  const [isCalculating, setIsCalculating] = useState(false)

  // Check if AI analysis has run (scores are not all 0)
  const hasAiRun = Object.values(aiScores).some(s => s > 0)

  const handleVote = (type: 'OVERREACH' | 'MISCONDUCT') => {
    startTransition(async () => {
      // Optimistic update
      setCurrentVote(type)
      
      const result = await voteAoi(novelId, type)
      if (!result.success) {
        // Revert on failure
        setCurrentVote(userVote) 
      }
    })
  }

  const handleCalculate = async () => {
    setIsCalculating(true)
    try {
      await triggerAoiCalculation(novelId)
    } finally {
      setIsCalculating(false)
    }
  }

  // Dimension labels
  const dimensions = [
    { key: 'rigor', label: '严谨性', value: aiScores.rigor },
    { key: 'reproducibility', label: '可复现性', value: aiScores.reproducibility },
    { key: 'standardization', label: '规范性', value: aiScores.standardization },
    { key: 'professionalism', label: '专业性', value: aiScores.professionalism },
    { key: 'objectivity', label: '客观性', value: aiScores.objectivity },
  ]

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-l-4 border-primary pl-3">
        <h3 className="text-xl font-bold flex items-center gap-2">
          学术过端指数
        </h3>
        {!hasAiRun && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCalculate} 
            disabled={isCalculating}
          >
            {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
            {isCalculating ? "计算中..." : "AI 评分"}
          </Button>
        )}
      </div>

      {/* Main Score Display */}
      <div className="space-y-2">
        <div className="flex items-end gap-2">
          <span className={cn(
            "text-6xl font-black tracking-tighter transition-colors",
            aoiScore > 5000 ? "text-red-500" : (aoiScore > 1000 ? "text-yellow-500" : "text-primary")
          )}>
            {aoiScore.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground mb-2">AOI</span>
        </div>
        
        {isDuplicate ? (
           <div className="bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-semibold px-3 py-1.5 rounded-md flex items-center gap-2">
             <CheckCircle2 className="h-4 w-4" />
             检测到一稿多投 (AOI 系数 x0.5)
           </div>
        ) : (
           <div className="bg-destructive/10 text-destructive text-sm font-semibold px-3 py-1.5 rounded-md flex items-center gap-2">
             <XCircle className="h-4 w-4" />
             未检测到一稿多投
           </div>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed">
           Academic Overreach Index<br/>
           衡量论文的学术“垃圾”含量，分数越低越垃圾。
        </p>
      </div>

      {/* AI Dimensions (Only show if calculated) */}
      {hasAiRun && (
        <div className="space-y-3 bg-muted/20 p-4 rounded-lg">
           <h4 className="text-sm font-semibold mb-2">AI 维度评分 (0-10)</h4>
           {dimensions.map((dim) => (
             <div key={dim.key} className="space-y-1">
               <div className="flex justify-between text-xs">
                 <span>{dim.label}</span>
                 <span className="font-mono">{dim.value}</span>
               </div>
               <Progress value={dim.value * 10} className="h-1.5" />
             </div>
           ))}
        </div>
      )}

      {/* Voting Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button 
          variant={currentVote === 'OVERREACH' ? "default" : "outline"}
          className={cn(
            "w-full gap-2",
            currentVote === 'OVERREACH' && "bg-green-600 hover:bg-green-700"
          )}
          onClick={() => handleVote('OVERREACH')}
          disabled={isPending}
        >
          <ThumbsUp className="h-4 w-4" />
          学术过端
          {currentVote === 'OVERREACH' && <span className="ml-1 text-xs opacity-70">(已投)</span>}
        </Button>
        
        <Button 
          variant={currentVote === 'MISCONDUCT' ? "destructive" : "outline"}
          className="w-full gap-2"
          onClick={() => handleVote('MISCONDUCT')}
          disabled={isPending}
        >
          <ThumbsDown className="h-4 w-4" />
          学术不端
          {currentVote === 'MISCONDUCT' && <span className="ml-1 text-xs opacity-70">(已投)</span>}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        投票将实时影响 AOI 指数
      </p>
    </section>
  )
}
