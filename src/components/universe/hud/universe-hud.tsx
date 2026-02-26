"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, BookOpen, Sword, X, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Journal {
  id: string
  name: string
  paperCount: number
  description?: string | null
  totalPopularity: number
  combatPower: number
}

interface Quiz {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  paperId: string
  paperTitle: string
}

interface UniverseHUDProps {
  currentJournal: Journal | null
  currentSeason: { id: string; name: string }
  onLeave: () => void
  onCombatUpdate: (journalId: string, newPower: number) => void
}

export function UniverseHUD({ currentJournal, currentSeason, onLeave, onCombatUpdate }: UniverseHUDProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  
  const [buffs, setBuffs] = useState<{id: number, text: string}[]>([])

  const addBuff = (text: string) => {
    const id = Date.now()
    setBuffs(prev => [...prev, { id, text }])
    setTimeout(() => {
      setBuffs(prev => prev.filter(b => b.id !== id))
    }, 3000)
  }

  const fetchQuiz = async () => {
    if (!currentJournal) return
    
    setLoading(true)
    setShowQuiz(true)
    setQuiz(null)
    setSelectedOption(null)
    setShowResult(false)
    setIsCorrect(false)

    try {
      const res = await fetch(`/api/universe/quiz?journalId=${currentJournal.id}`)
      const data = await res.json()
      
      if (!res.ok) {
        if (res.status === 429) {
          // Keep toast for errors as they are important and usually don't block ongoing interaction like result feedback
          toast.error("今日答题次数已达上限 (3/3)")
        } else {
          toast.error(data.error || "题目生成失败，请稍后重试")
        }
        setShowQuiz(false)
        return
      }
      
      setQuiz(data)
    } catch (error) {
      console.error(error)
      toast.error("网络请求失败，请检查连接")
      setShowQuiz(false)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (index: number) => {
    if (showResult || !currentJournal) return
    setSelectedOption(index)
    setShowResult(true)

    if (index === quiz?.correctAnswer) {
      setIsCorrect(true)
      const bonus = Math.floor(Math.random() * 5) + 1
      
      // Call API to update combat power
      try {
        const res = await fetch('/api/universe/combat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            journalId: currentJournal.id,
            bonus,
            seasonId: currentSeason.id,
            quizId: quiz?.id
          })
        })
        
        if (res.ok) {
          const data = await res.json()
          onCombatUpdate(currentJournal.id, data.newCombatPower)
          addBuff(`星球战力 +${bonus}`)
        }
      } catch (error) {
        console.error("Failed to update combat power", error)
      }
    } else {
      setIsCorrect(false)
    }
  }

  if (!currentJournal) {
    return (
      <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white/50 text-sm">
          <p>正在漫游宇宙...</p>
          <p>点击任意星球加入阵营</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 max-w-sm w-full">
      {/* Buff Notifications */}
      <div className="flex flex-col gap-2 items-end pointer-events-none h-24 justify-end">
        <AnimatePresence>
          {buffs.slice(-3).map((buff) => (
            <motion.div
              key={buff.id}
              initial={{ opacity: 0, y: 20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(234,179,8,0.2)]"
            >
              {buff.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main HUD Panel */}
      <motion.div 
        layout
        className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-full"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            {/* Tech-style Planet Icon/Avatar */}
            <div className="relative h-12 w-12 flex items-center justify-center">
               <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse"></div>
               <div className="absolute inset-0 border-2 border-blue-400/50 rounded-full border-t-transparent animate-[spin_3s_linear_infinite]"></div>
               <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10 z-10 overflow-hidden">
                 <span className="text-white font-black text-lg select-none">
                   {currentJournal.name[0].toUpperCase()}
                 </span>
               </div>
            </div>
            
            <div>
              <h3 className="font-bold text-white text-sm">{currentJournal.name}</h3>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="flex items-center gap-1 text-yellow-400 font-bold">
                  <Sword className="w-3 h-3" /> 
                  {currentJournal.combatPower}
                </span>
                <span className="flex items-center gap-1 text-blue-300">
                  <BookOpen className="w-3 h-3" /> 
                  {currentJournal.paperCount}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onLeave}
            className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {!showQuiz ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400 line-clamp-3">
                {currentJournal.description || "暂无描述"}
              </p>
              
              <button
                onClick={fetchQuiz}
                className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors active:scale-95"
              >
                <Sword className="w-4 h-4" />
                挑战答题 (Buff加成)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>每日挑战</span>
                <button onClick={() => setShowQuiz(false)} className="hover:text-white">退出</button>
              </div>

              {loading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-xs">AI 正在阅读论文出题中...</p>
                </div>
              ) : quiz ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-xs text-blue-400 font-medium">
                    来源: 《{quiz.paperTitle}》
                  </div>
                  <h4 className="text-white font-medium text-sm leading-relaxed">
                    {quiz.question}
                  </h4>
                  
                  <div className="space-y-2">
                    {quiz.options.map((option, idx) => {
                      let stateStyle = "bg-white/5 hover:bg-white/10 border-white/5"
                      if (showResult) {
                        if (idx === quiz.correctAnswer) stateStyle = "bg-green-500/20 border-green-500/50 text-green-200"
                        else if (idx === selectedOption) stateStyle = "bg-red-500/20 border-red-500/50 text-red-200"
                        else stateStyle = "opacity-50"
                      }

                      return (
                        <button
                          key={idx}
                          disabled={showResult}
                          onClick={() => handleAnswer(idx)}
                          className={`w-full text-left p-3 rounded-lg text-sm transition-all border ${stateStyle}`}
                        >
                          <span className="mr-2 opacity-50">{String.fromCharCode(65 + idx)}.</span>
                          {option}
                        </button>
                      )
                    })}
                  </div>

                  {showResult && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                      <div className={`text-center font-bold text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {isCorrect ? '🎉 回答正确' : '❌ 回答错误'}
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-200">
                        <span className="font-bold">解析：</span>
                        {quiz.explanation}
                        <button 
                          onClick={fetchQuiz}
                          className="mt-2 w-full py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded text-center transition-colors font-medium"
                        >
                          下一题
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-red-400 text-sm">
                  出题失败，请重试
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
