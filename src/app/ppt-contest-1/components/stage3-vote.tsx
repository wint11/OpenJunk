"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { getRandomInterpretationForVoting, voteInterpretation } from "../actions"
import { Loader2, Play, Pause, ArrowLeft, Heart, ChevronLeft, ChevronRight, Smile, Frown, User } from "lucide-react"
import { Card } from "@/components/ui/card"
import dynamic from 'next/dynamic'
import Link from "next/link"

// Dynamically import PdfPreview with ssr disabled
const PdfPreview = dynamic(() => import('./pdf-preview'), { 
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center gap-4 h-full min-h-[400px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">加载预览组件...</p>
        </div>
    )
});

export function Stage3Vote() {
  const [work, setWork] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackPage, setPlaybackPage] = useState(1)
  const [hasVoted, setHasVoted] = useState(false)
  
  // 用户的选择：'interesting' | 'not-interested' | null
  const [userChoice, setUserChoice] = useState<'interesting' | 'not-interested' | null>(null)
  
  // 评价次数限制相关状态
  const [voteCount, setVoteCount] = useState(0)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [rateLimitMessage, setRateLimitMessage] = useState('')
  
  // Track seen IDs to avoid repetition
  const seenIdsRef = useRef<string[]>([])
  
  // Track history for previous/next navigation
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // localStorage key
  const VOTE_LIMIT_KEY = 'ppt-contest-vote-limit'
  const MAX_VOTES_PER_HOUR = 20
  
  // 检查评价次数限制
  const checkVoteLimit = () => {
    if (typeof window === 'undefined') return { canVote: true, remaining: MAX_VOTES_PER_HOUR }
    
    const stored = localStorage.getItem(VOTE_LIMIT_KEY)
    const now = Date.now()
    const oneHour = 60 * 60 * 1000 // 1小时 = 3600000毫秒
    
    if (!stored) {
      return { canVote: true, remaining: MAX_VOTES_PER_HOUR }
    }
    
    try {
      const data = JSON.parse(stored)
      const { count, timestamp } = data
      
      // 如果超过1小时，重置计数
      if (now - timestamp > oneHour) {
        localStorage.removeItem(VOTE_LIMIT_KEY)
        return { canVote: true, remaining: MAX_VOTES_PER_HOUR }
      }
      
      const remaining = Math.max(0, MAX_VOTES_PER_HOUR - count)
      return { canVote: remaining > 0, remaining, count }
    } catch {
      localStorage.removeItem(VOTE_LIMIT_KEY)
      return { canVote: true, remaining: MAX_VOTES_PER_HOUR }
    }
  }
  
  // 记录一次评价
  const recordVote = () => {
    if (typeof window === 'undefined') return
    
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const stored = localStorage.getItem(VOTE_LIMIT_KEY)
    
    let newCount = 1
    let timestamp = now
    
    if (stored) {
      try {
        const data = JSON.parse(stored)
        // 如果还在1小时内，累加
        if (now - data.timestamp <= oneHour) {
          newCount = data.count + 1
          timestamp = data.timestamp
        }
      } catch {
        // 解析失败，使用新值
      }
    }
    
    localStorage.setItem(VOTE_LIMIT_KEY, JSON.stringify({ count: newCount, timestamp }))
    setVoteCount(newCount)
    
    // 检查是否达到限制
    if (newCount >= MAX_VOTES_PER_HOUR) {
      setIsRateLimited(true)
      const resetTime = new Date(timestamp + oneHour)
      setRateLimitMessage(`已达到每小时${MAX_VOTES_PER_HOUR}次评价限制，请在 ${resetTime.toLocaleTimeString()} 后再试`)
    }
    
    return newCount
  }
  
  // 组件加载时检查限制
  useEffect(() => {
    const limit = checkVoteLimit()
    setVoteCount(limit.count || 0)
    if (!limit.canVote) {
      setIsRateLimited(true)
      const stored = localStorage.getItem(VOTE_LIMIT_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          const resetTime = new Date(data.timestamp + 60 * 60 * 1000)
          setRateLimitMessage(`已达到每小时${MAX_VOTES_PER_HOUR}次评价限制，请在 ${resetTime.toLocaleTimeString()} 后再试`)
        } catch {
          setRateLimitMessage(`已达到每小时${MAX_VOTES_PER_HOUR}次评价限制，请1小时后再试`)
        }
      }
    }
  }, [])
  
  const fetchWork = async (addToHistory = true) => {
    setIsLoading(true)
    setHasVoted(false)
    setUserChoice(null)  // 重置用户选择
    setCurrentTime(0)
    setPlaybackPage(1)
    
    if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
    }
    
    try {
        const data = await getRandomInterpretationForVoting(seenIdsRef.current)
        
        if (data) {
            seenIdsRef.current.push(data.id);
            
            // Add to history if requested
            if (addToHistory) {
                const newHistory = [...history]
                // Remove any items after current index (if we're navigating back)
                if (historyIndex < history.length - 1) {
                    newHistory.splice(historyIndex + 1)
                }
                newHistory.push(data)
                setHistory(newHistory)
                setHistoryIndex(newHistory.length - 1)
            }
            setWork(data)
        } else {
            setWork(null)
        }
    } catch (e) {
        console.error(e)
    } finally {
        setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWork()
  }, [])

  // Sync page based on timestamps
  useEffect(() => {
      if (!work?.timestamps) return;
      
      try {
          const timestamps = JSON.parse(work.timestamps);
          // Find current page based on timestamps
          let currentPage = 1;
          for (let i = timestamps.length - 1; i >= 0; i--) {
              if (currentTime >= timestamps[i].time) {
                  currentPage = timestamps[i].page;
                  break;
              }
          }
          setPlaybackPage(currentPage);
      } catch (e) {
          console.error("Failed to parse timestamps", e);
      }
  }, [currentTime, work]);

  // Auto play when work loads
  useEffect(() => {
      // Modern browsers block autoplay unless user has interacted with document
      // We'll try to autoplay, but if it fails, we just set state to paused
      // and user has to click play manually.
      if (work && audioRef.current) {
          audioRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(err => {
                  console.log("Autoplay blocked, waiting for user interaction:", err);
                  setIsPlaying(false);
              });
      }
  }, [work]);

  const togglePlay = () => {
      if (audioRef.current) {
          if (isPlaying) {
              audioRef.current.pause();
              setIsPlaying(false);
          } else {
              audioRef.current.play();
              setIsPlaying(true);
          }
      }
  }

  const handleVote = async () => {
      if (!work || hasVoted) return;
      setHasVoted(true);
      await voteInterpretation(work.id);
      
      // Auto skip after short delay
      setTimeout(() => {
          fetchWork();
      }, 1000);
  }

  const handleInteresting = () => {
      if (!work) return;
      setUserChoice('interesting');
  }

  const handleNotInterested = () => {
      if (!work) return;
      setUserChoice('not-interested');
  }

  const handlePrevious = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex)
          setWork(history[newIndex])
          setHasVoted(false)
          setCurrentTime(0)
          setPlaybackPage(1)
          
          if (audioRef.current) {
              audioRef.current.pause()
              setIsPlaying(false)
          }
      } else {
          alert("已经是第一个作品了")
      }
  }

  const handleNext = async () => {
      // 检查是否达到评价限制
      if (work && userChoice) {
          const limit = checkVoteLimit()
          if (!limit.canVote) {
              alert(rateLimitMessage || `已达到每小时${MAX_VOTES_PER_HOUR}次评价限制`)
              return
          }
          
          // 提交投票
          const increment = userChoice === 'interesting' ? 1 : -1;
          await voteInterpretation(work.id, increment);
          
          // 记录本次评价
          recordVote()
      }
      
      // 然后获取下一个作品
      fetchWork();
  }

  if (isLoading) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">正在寻找下一个“受害者”...</p>
          </div>
      )
  }

  if (!work) {
      if (seenIdsRef.current.length > 0) {
          // All works viewed
          return (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <Smile className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">太棒了，所有作品都已鉴赏完毕！</h3>
                  <p className="text-muted-foreground mb-8">目前没有新的作品了，感谢您的评审。</p>
                  <Button variant="outline" asChild>
                      <Link href="/ppt-contest-1">返回首页</Link>
                  </Button>
              </div>
          )
      }

      // No works at all
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                  <User className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">暂时没有作品</h3>
              <p className="text-muted-foreground mb-8">大家都在努力录制中，请稍后再来围观。</p>
              <Button variant="outline" asChild>
                  <Link href="/ppt-contest-1">返回首页</Link>
              </Button>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" asChild>
                 <Link href="/ppt-contest-1">
                     <ArrowLeft className="h-5 w-5" />
                 </Link>
             </Button>
             <div>
                 <h1 className="font-bold text-lg">大众评审</h1>
                 <div className="text-xs text-muted-foreground flex items-center gap-2">
                     <span>作品 ID: {work.id.slice(-4)}</span>
                     <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                     <span>时长: {Math.floor(work.duration / 60)}:{String(work.duration % 60).padStart(2, '0')}</span>
                 </div>
             </div>
          </div>
          

      </div>

      {/* Main Content */}
      <div className="flex-1 relative bg-muted/10 overflow-hidden flex flex-col items-center justify-center p-6">
          <div className="w-full h-full max-w-6xl bg-white shadow-lg rounded-lg overflow-hidden border flex flex-col relative">
               {work.submission.previewUrl ? (
                   <PdfPreview 
                       url={work.submission.previewUrl} 
                       controlledPage={playbackPage}
                   />
               ) : (
                   <div className="flex items-center justify-center h-full text-muted-foreground">
                       无法加载预览
                   </div>
               )}
          </div>
      </div>

      {/* 评价次数提示 */}
      {isRateLimited ? (
          <div className="bg-red-50 border-t border-red-200 p-2 text-center text-red-600 text-sm">
              {rateLimitMessage}
          </div>
      ) : (
          <div className="bg-muted/30 border-t p-2 text-center text-muted-foreground text-sm">
              今日剩余评价次数：{MAX_VOTES_PER_HOUR - voteCount}/{MAX_VOTES_PER_HOUR} 
              {userChoice && <span className="ml-2 text-primary">（已选择：{userChoice === 'interesting' ? '有意思' : '不感兴趣'}）</span>}
          </div>
      )}

      {/* Footer Controls - 五个按钮布局 */}
      <div className={`border-t bg-background/95 backdrop-blur p-4 flex items-center justify-center gap-6 shrink-0 ${isRateLimited ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* 上一个按钮 */}
          <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 rounded-full border-2"
              onClick={handlePrevious}
              title="上一个"
              disabled={historyIndex <= 0}
          >
              <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* 有意思按钮 */}
          <Button 
              variant="default" 
              size="lg" 
              className={`h-12 px-6 rounded-full gap-2 transition-all ${
                  userChoice === 'interesting' 
                      ? 'bg-green-600 ring-2 ring-green-300 ring-offset-2' 
                      : 'bg-green-500 hover:bg-green-600'
              } text-white`}
              onClick={handleInteresting}
              title="有意思"
              disabled={!work}
          >
              <Smile className={`h-5 w-5 ${userChoice === 'interesting' ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">
                  {userChoice === 'interesting' ? '已选择' : '有意思'}
              </span>
          </Button>

          {/* 播放/暂停按钮（中间） */}
          <Button 
              variant="default" 
              size="icon" 
              className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
              onClick={togglePlay}
              title={isPlaying ? "暂停" : "播放"}
              disabled={!work}
          >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </Button>

          {/* 不感兴趣按钮 */}
          <Button 
              variant={userChoice === 'not-interested' ? 'default' : 'outline'}
              size="lg" 
              className={`h-12 px-6 rounded-full gap-2 transition-all ${
                  userChoice === 'not-interested' 
                      ? 'bg-red-500 hover:bg-red-600 text-white ring-2 ring-red-300 ring-offset-2' 
                      : 'border-2 border-red-300 text-red-500 hover:bg-red-50'
              }`}
              onClick={handleNotInterested}
              title="不感兴趣"
              disabled={!work}
          >
              <Frown className={`h-5 w-5 ${userChoice === 'not-interested' ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">
                  {userChoice === 'not-interested' ? '已选择' : '不感兴趣'}
              </span>
          </Button>

          {/* 下一个按钮 */}
          <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 rounded-full border-2"
              onClick={handleNext}
              title="下一个"
              disabled={!work}
          >
              <ChevronRight className="h-5 w-5" />
          </Button>
          
          <audio 
              ref={audioRef} 
              src={work.audioUrl} 
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
          />
      </div>
    </div>
  )
}
