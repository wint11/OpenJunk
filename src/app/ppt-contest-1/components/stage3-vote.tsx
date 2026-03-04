"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { getRandomInterpretationForVoting, voteInterpretation } from "../actions"
import { Loader2, ThumbsUp, SkipForward, Play, Pause, ArrowLeft, Heart, Star, User } from "lucide-react"
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
  
  // Track seen IDs to avoid repetition
  const seenIdsRef = useRef<string[]>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  const fetchWork = async () => {
    setIsLoading(true)
    setHasVoted(false)
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
                      <ThumbsUp className="h-12 w-12 text-green-600" />
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
          
          <div className="flex items-center gap-2">
              <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  {work.votes} 票
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

      {/* Footer Controls */}
      <div className="h-24 border-t bg-background/95 backdrop-blur p-4 flex items-center justify-center gap-8 shrink-0">
          <Button 
              variant="outline" 
              size="icon" 
              className="h-14 w-14 rounded-full border-2"
              onClick={togglePlay}
          >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </Button>

          <Button 
              size="lg" 
              className={`h-14 px-8 rounded-full text-lg gap-2 shadow-lg transition-all ${hasVoted ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
              onClick={handleVote}
              disabled={hasVoted}
          >
              {hasVoted ? (
                  <>
                      <Heart className="h-6 w-6 fill-current animate-ping" /> 已投票
                  </>
              ) : (
                  <>
                      <ThumbsUp className="h-6 w-6" /> 这个讲得好！
                  </>
              )}
          </Button>

          <Button 
              variant="ghost" 
              size="lg" 
              className="h-14 px-6 rounded-full text-muted-foreground hover:bg-muted"
              onClick={fetchWork}
          >
              <SkipForward className="h-6 w-6" /> 下一个
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
