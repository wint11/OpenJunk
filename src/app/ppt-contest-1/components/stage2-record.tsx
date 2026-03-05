"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getRandomPPTForRecording, submitInterpretation } from "../actions"
import { Loader2, Mic, StopCircle, Play, RefreshCw, Send, ArrowLeft, Timer, CheckCircle, Info } from "lucide-react"
import Link from "next/link"
import dynamic from 'next/dynamic'
import { Card } from "@/components/ui/card"

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

export function Stage2Record() {
  const [ppt, setPpt] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [duration, setDuration] = useState(0)
  const [pageTimestamps, setPageTimestamps] = useState<{page: number, time: number}[]>([])
  const [playbackTime, setPlaybackTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackPage, setPlaybackPage] = useState(1)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingStartTimeRef = useRef<number>(0)

  // Cleanup audio URL on unmount or when blob changes
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  // Handle playback sync
  useEffect(() => {
      if (isPlaying && audioRef.current) {
          const interval = setInterval(() => {
              if (audioRef.current) {
                  const currentTime = audioRef.current.currentTime;
                  setPlaybackTime(currentTime);
                  
                  // Find current page based on timestamps
                  // Timestamps should be sorted by time
                  // Find the last timestamp that is <= currentTime
                  let currentPage = 1;
                  for (let i = pageTimestamps.length - 1; i >= 0; i--) {
                      if (currentTime >= pageTimestamps[i].time) {
                          currentPage = pageTimestamps[i].page;
                          break;
                      }
                  }
                  setPlaybackPage(currentPage);
              }
          }, 100); // Check every 100ms
          return () => clearInterval(interval);
      }
  }, [isPlaying, pageTimestamps]);

  const fetchRandomPPT = async () => {
    setIsLoading(true)
    setSuccess(false)
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setPageTimestamps([])
    
    // Stop recording if active
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    if (timerRef.current) {
        clearInterval(timerRef.current)
    }
    setIsRecording(false)
    
    try {
        const data = await getRandomPPTForRecording()
        if (!data) {
            alert("暂无可用的 PPT，请稍后再试")
            setPpt(null)
        } else {
            setPpt(data)
        }
    } catch (e) {
        console.error(e)
        alert("获取PPT失败，请重试")
    } finally {
        setIsLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
      if (isRecording) {
          const currentTime = (Date.now() - recordingStartTimeRef.current) / 1000;
          setPageTimestamps(prev => [...prev, { page: newPage, time: currentTime }]);
      }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setIsProcessing(false)
      }

      mediaRecorder.start()
      setIsRecording(true)
      recordingStartTimeRef.current = Date.now();
      // Record initial page
      setPageTimestamps([{ page: 1, time: 0 }]);
      
      // Start timer
      setDuration(0)
      timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1)
      }, 1000)
      
    } catch (err) {
      console.error("Error accessing microphone:", err)
      alert("无法访问麦克风，请检查权限设置")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsProcessing(true)
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      
      if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
      }
    }
  }

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async () => {
    if (!audioBlob || !ppt) return
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('audio', audioBlob)
    formData.append('submissionId', ppt.id) // Corrected field name
    formData.append('duration', duration.toString())
    // Ensure timestamps are sorted by time before submitting
    const sortedTimestamps = [...pageTimestamps].sort((a, b) => a.time - b.time);
    formData.append('timestamps', JSON.stringify(sortedTimestamps))
    
    const result = await submitInterpretation(formData)
    
    if (result.error) {
      alert(result.error)
    } else {
      setSuccess(true)
    }
    setIsSubmitting(false)
  }

  // Initial State: Welcome Screen
  if (!ppt && !isLoading && !success) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-muted/10 relative">
          <Button variant="ghost" size="icon" asChild className="absolute top-4 left-4">
             <Link href="/ppt-contest-1">
                 <ArrowLeft className="h-5 w-5" />
             </Link>
          </Button>
          
          <div className="max-w-md text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mic className="h-12 w-12 text-primary" />
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight">准备好乱讲了吗？</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                  系统将随机抽取一份陌生人的 PPT。<br/>
                  你需要在完全不知情的情况下，<br/>
                  即兴编造一段 5 分钟以内的演讲。
              </p>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-6 rounded-xl text-left border border-yellow-100 dark:border-yellow-900/50">
                  <h4 className="font-bold flex items-center gap-2 mb-3 text-yellow-700 dark:text-yellow-500">
                      <Info className="h-4 w-4" /> 乱讲指南
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• 遇到不懂的图表？自信地说“如图所示，趋势很明显...”</li>
                      <li>• 遇到空白页？那是“留白艺术，引发思考”。</li>
                      <li>• 内容对不上？无视它，坚持你的理论！</li>
                      <li>• 只有一次机会，录制开始后无法暂停。</li>
                  </ul>
              </div>

              <Button size="lg" className="w-full h-14 text-lg shadow-xl" onClick={fetchRandomPPT}>
                  开始挑战
              </Button>
          </div>
      </div>
    )
  }

  // Loading State
  if (isLoading) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-xl font-medium">正在抽取倒霉蛋的 PPT...</h3>
          </div>
      )
  }

  // Success State
  if (success) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-green-50/50 dark:bg-green-950/10">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-3xl font-bold mb-4">提交成功！</h3>
              <p className="text-muted-foreground mb-8 text-lg">你的胡说八道已经记录在案。</p>
              
              <div className="flex gap-4">
                  <Button variant="outline" size="lg" asChild>
                      <Link href="/ppt-contest-1">返回首页</Link>
                  </Button>
                  <Button size="lg" onClick={fetchRandomPPT}>
                      再挑战一个
                  </Button>
              </div>
          </div>
      )
  }

  // Recording Interface
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header / Toolbar */}
      <div className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => {
                 if (isRecording) {
                     if (confirm("正在录音，确定要退出吗？")) {
                         stopRecording();
                         setPpt(null);
                     }
                 } else {
                     setPpt(null);
                 }
             }}>
                 <ArrowLeft className="h-5 w-5" />
             </Button>
             <div>
                 <h1 className="font-bold text-lg truncate max-w-[200px]">{ppt?.title || "无题"}</h1>
                 <div className="flex items-center gap-2 text-xs text-muted-foreground">
                     <Timer className="h-3 w-3" />
                     <span className={isRecording ? "text-red-500 font-mono font-bold" : "font-mono"}>
                         {formatTime(duration)}
                     </span>
                 </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
              {/* Playback Controls when recording is finished */}
              {audioUrl && !isSubmitting && (
                  <div className="mr-4 flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => {
                          if (audioRef.current) {
                              if (isPlaying) {
                                  audioRef.current.pause();
                                  setIsPlaying(false);
                              } else {
                                  audioRef.current.play();
                                  setIsPlaying(true);
                              }
                          }
                      }}>
                          {isPlaying ? <div className="h-3 w-3 bg-foreground rounded-sm" /> : <Play className="h-3 w-3 fill-current" />}
                      </Button>
                      <div className="text-xs font-mono w-24 text-center">
                          {formatTime(playbackTime)} / {formatTime(duration)}
                      </div>
                      {/* Hidden audio element */}
                      <audio 
                          ref={audioRef} 
                          src={audioUrl} 
                          onEnded={() => setIsPlaying(false)} 
                          onPause={() => setIsPlaying(false)}
                          onPlay={() => setIsPlaying(true)}
                      />
                  </div>
              )}

              {/* Only show Start button in header if we are already in recording mode (safety fallback) */}
              {isRecording && (
                  <Button onClick={stopRecording} variant="destructive" className="animate-pulse shadow-md">
                      <StopCircle className="mr-2 h-4 w-4" /> 完成录制
                  </Button>
              )}

              {audioBlob && !isSubmitting && (
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                          if (confirm("确定要放弃这段录音吗？放弃后将无法找回。")) {
                              setAudioBlob(null);
                              setAudioUrl(null);
                              setDuration(0);
                              setPpt(null); // Go back to start
                          }
                      }}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> 放弃并退出
                      </Button>
                      <Button variant="outline" onClick={() => {
                          if (confirm("确定要放弃这段录音并重新挑战一份新的PPT吗？")) {
                              fetchRandomPPT();
                          }
                      }}>
                          <RefreshCw className="mr-2 h-4 w-4" /> 再录一份
                      </Button>
                      <Button onClick={handleSubmit} className="shadow-md bg-green-600 hover:bg-green-700 text-white">
                          <Send className="mr-2 h-4 w-4" /> 上传作品
                      </Button>
                  </div>
              )}
              
              {isSubmitting && (
                  <Button disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 提交中...
                  </Button>
              )}
          </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 relative bg-muted/10 overflow-hidden flex flex-col items-center justify-center p-6">
          <div className="w-full h-full max-w-6xl bg-white shadow-lg rounded-lg overflow-hidden border flex flex-col relative">
               {/* Use the PDF preview component */}
               {/* Only show preview if recording started or finished */}
               {(isRecording || audioBlob) && ppt?.previewUrl ? (
                   <PdfPreview 
                       url={ppt.previewUrl} 
                       controlledPage={audioBlob ? playbackPage : undefined}
                       onPageChange={handlePageChange}
                   />
               ) : (isRecording || audioBlob) ? (
                   <div className="flex items-center justify-center h-full text-muted-foreground">
                       该 PPT 暂无预览内容
                   </div>
               ) : (
                   <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-900/50">
                       <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 animate-pulse">
                           <Info className="h-10 w-10 text-muted-foreground" />
                       </div>
                       <h3 className="text-2xl font-bold mb-2">内容已隐藏</h3>
                       <p className="text-muted-foreground max-w-md text-center mb-8">
                           为了保证“即兴”效果，只有在点击开始录音后，<br/>你才能看到 PPT 的具体内容。
                       </p>
                       <Button onClick={startRecording} size="lg" className="bg-red-500 hover:bg-red-600 text-white shadow-lg text-lg h-12 px-8">
                           <Mic className="mr-2 h-5 w-5" /> 我准备好了，开始录音！
                       </Button>
                   </div>
               )}
          </div>
      </div>
    </div>
  )
}
