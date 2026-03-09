"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { Novel } from "@prisma/client"
import { Trash2, FileText, ChevronRight, ChevronLeft, BookOpen } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { NewsSection } from "@/components/news-section"

interface SplashTrashDeckProps {
  papers: (Novel & {
    journal: { id: string; name: string } | null
  })[]
  viewMode?: "pdf" | "cover"
}

// ------------------- BOOK VIEW COMPONENTS -------------------

const BOOK_WIDTH = 500
const BOOK_HEIGHT = 700
const TRANSITION_DURATION = 0.6

const getCoverUrl = (paper: any) => {
  if (!paper?.coverUrl) return null
  if (paper.coverUrl.startsWith('http') || paper.coverUrl.startsWith('/')) {
    return paper.coverUrl
  }
  return `/uploads/covers/${paper.coverUrl}`
}

const BookPage = ({ paper, side, shadow = false }: { paper: any, side: "left" | "right", shadow?: boolean }) => {
  const coverUrl = getCoverUrl(paper)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className={cn(
      "relative w-full h-full overflow-hidden bg-white dark:bg-zinc-900",
      side === "left" ? "rounded-l-md" : "rounded-r-md",
      "border-y border-zinc-200 dark:border-zinc-800",
      side === "left" ? "border-l" : "border-r"
    )}>
      {/* Content */}
      <div className="relative w-full h-full p-0">
        {coverUrl ? (
          <Link
            href={paper?.id ? `/novel/${paper.id}` : '#'}
            className="block w-full h-full relative z-50"
            onClick={handleClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={paper?.title || "Cover"}
              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
            />
          </Link>
        ) : (
          <Link
            href={paper?.id ? `/novel/${paper.id}` : '#'}
            className="block w-full h-full relative z-50"
            onClick={handleClick}
          >
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
              <BookOpen className="w-16 h-16 mb-2 opacity-30" />
              <span className="text-xs">暂无封面</span>
            </div>
          </Link>
        )}

        {/* Inner Shadow for depth */}
        <div className={cn(
          "absolute inset-0 pointer-events-none",
          side === "left"
            ? "bg-gradient-to-r from-black/5 to-transparent via-transparent"
            : "bg-gradient-to-l from-black/5 to-transparent via-transparent"
        )} />

        {/* Spine Shadow */}
        <div className={cn(
          "absolute inset-y-0 w-8 pointer-events-none opacity-20 mix-blend-multiply dark:mix-blend-multiply",
          side === "left"
            ? "right-0 bg-gradient-to-l from-black to-transparent"
            : "left-0 bg-gradient-to-r from-black to-transparent"
        )} />
      </div>

      {/* Dynamic Shadow for Flipping */}
      {shadow && (
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      )}
    </div>
  )
}

const BookView = ({ papers }: { papers: any[] }) => {
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [animatingSheet, setAnimatingSheet] = useState<number | null>(null)
  const [direction, setDirection] = useState<"next" | "prev" | null>(null)

  const totalSpreads = Math.ceil(papers.length / 2)

  const goToNext = () => {
    if (isFlipping) return
    setIsFlipping(true)
    setDirection("next")
    // 循环到下一页，如果是最后一页则回到第一页
    const nextSheet = spreadIndex >= totalSpreads - 1 ? 0 : spreadIndex + 1
    setAnimatingSheet(nextSheet)
  }

  const goToPrev = () => {
    if (isFlipping) return
    setIsFlipping(true)
    setDirection("prev")
    // 循环到上一页，如果是第一页则回到最后一页
    const prevSheet = spreadIndex <= 0 ? totalSpreads - 1 : spreadIndex
    setAnimatingSheet(prevSheet)
  }

  const handleAnimationComplete = () => {
    if (direction === "next") {
      setSpreadIndex(prev => prev >= totalSpreads - 1 ? 0 : prev + 1)
    } else if (direction === "prev") {
      setSpreadIndex(prev => prev <= 0 ? totalSpreads - 1 : prev - 1)
    }
    setIsFlipping(false)
    setAnimatingSheet(null)
    setDirection(null)
  }

  // Calculate indices
  // Current Spread: Left=spreadIndex*2, Right=spreadIndex*2+1
  
  // Base Pages (Underneath)
  let baseLeftIndex = -1
  let baseRightIndex = -1

  if (isFlipping && animatingSheet !== null) {
    // If animating sheet K (Front=2K-1, Back=2K)
    // Left Base is 2(K-1) = 2K-2
    // Right Base is 2K+1
    baseLeftIndex = (animatingSheet - 1) * 2
    baseRightIndex = animatingSheet * 2 + 1
  } else {
    // Static
    baseLeftIndex = spreadIndex * 2
    baseRightIndex = spreadIndex * 2 + 1
  }

  const baseLeftPaper = papers[baseLeftIndex]
  const baseRightPaper = papers[baseRightIndex]

  // Flipper Pages
  // If animatingSheet K: Front=2K-1, Back=2K
  const flipperFrontIndex = animatingSheet !== null ? animatingSheet * 2 - 1 : -1
  const flipperBackIndex = animatingSheet !== null ? animatingSheet * 2 : -1
  
  const flipperFrontPaper = papers[flipperFrontIndex]
  const flipperBackPaper = papers[flipperBackIndex]

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative flex items-center justify-center perspective-[2000px]">
        {/* Book Container */}
        <div 
          className="relative flex items-center justify-center"
          style={{ width: 'min(90vw, 1000px)', aspectRatio: '1.5/1' }}
        >
          {/* Back Cover / Pages Stack Effect (Left) */}
          <div className="absolute left-1/2 top-2 bottom-2 w-[48%] -translate-x-[102%] rounded-l-md bg-white border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 shadow-xl transform translate-z-[-2px]">
             <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-zinc-200 to-transparent dark:from-zinc-900" />
          </div>
          {/* Back Cover / Pages Stack Effect (Right) */}
          <div className="absolute right-1/2 top-2 bottom-2 w-[48%] translate-x-[102%] rounded-r-md bg-white border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 shadow-xl transform translate-z-[-2px]">
             <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-zinc-200 to-transparent dark:from-zinc-900" />
          </div>

          {/* BASE LEFT PAGE */}
          <div className="absolute left-0 w-[50%] h-full z-0 pr-[1px]"> {/* pr-1px for spine gap */}
             {baseLeftPaper ? (
               <BookPage paper={baseLeftPaper} side="left" />
             ) : (
               <div className="w-full h-full bg-transparent" /> // Empty slot
             )}
          </div>

          {/* BASE RIGHT PAGE */}
          <div className="absolute right-0 w-[50%] h-full z-0 pl-[1px]">
             {baseRightPaper ? (
               <BookPage paper={baseRightPaper} side="right" />
             ) : (
               <div className="w-full h-full bg-transparent" />
             )}
          </div>

          {/* FLIPPING SHEET */}
          {isFlipping && animatingSheet !== null && (
            <motion.div
              className="absolute left-1/2 top-0 bottom-0 w-[50%] z-20 origin-left"
              initial={{ rotateY: direction === "next" ? 0 : -180 }}
              animate={{ rotateY: direction === "next" ? -180 : 0 }}
              transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1.000] }} // cubic-bezier for smooth paper feel
              onAnimationComplete={handleAnimationComplete}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front Face (Visible when rotateY = 0) - Acts as RIGHT PAGE */}
              <div 
                className="absolute inset-0 backface-hidden pl-[1px]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <BookPage paper={flipperFrontPaper} side="right" shadow={true} />
                {/* Lighting gradient that changes with rotation could be added here */}
              </div>

              {/* Back Face (Visible when rotateY = -180) - Acts as LEFT PAGE */}
              <div 
                className="absolute inset-0 backface-hidden pr-[1px]"
                style={{ 
                  backfaceVisibility: "hidden", 
                  transform: "rotateY(180deg)" 
                }}
              >
                <BookPage paper={flipperBackPaper} side="left" shadow={true} />
              </div>
            </motion.div>
          )}
          
          {/* Spine Highlight */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/10 dark:bg-white/10 z-30 shadow-[0_0_10px_rgba(0,0,0,0.5)]" />

        </div>

        {/* Navigation Buttons (Floating) */}
        <button
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          disabled={isFlipping}
          className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 hover:bg-background backdrop-blur text-foreground shadow-lg transition-all z-50 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          disabled={isFlipping}
          className="absolute -right-4 md:-right-16 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 hover:bg-background backdrop-blur text-foreground shadow-lg transition-all z-50 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Page Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 z-50">
         {/* 论文计数指示器 */}
         <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-1 rounded-full">
           第 {spreadIndex * 2 + 1}-{Math.min((spreadIndex + 1) * 2, papers.length)} 篇 / 共 {papers.length} 篇
         </div>
         <div className="flex justify-center gap-1">
           {Array.from({ length: totalSpreads }).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  idx === spreadIndex ? "w-8 bg-primary" : "w-2 bg-primary/20"
                )}
              />
           ))}
         </div>
      </div>
    </div>
  )
}

// ------------------- MAIN COMPONENT -------------------

export function SplashTrashDeck({ papers, viewMode = "pdf" }: SplashTrashDeckProps) {
  const [showSplash, setShowSplash] = useState(true)
  const [cardsThrown, setCardsThrown] = useState(false)
  
  // PDF Carousel State
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const lastNavTime = useRef(0)
  
  // Trigger splash sequence on mount
  useEffect(() => {
    const sequence = async () => {
      await new Promise(r => setTimeout(r, 1000))
      setCardsThrown(true)
      await new Promise(r => setTimeout(r, 2000))
      setShowSplash(false)
    }
    sequence()
  }, [])

  const paginate = (newDirection: number) => {
    const now = Date.now()
    if (now - lastNavTime.current < 800) return
    lastNavTime.current = now

    setDirection(newDirection)
    setCurrentPageIndex((prev) => {
      let nextIndex = prev + newDirection
      if (nextIndex < 0) nextIndex = papers.length - 1
      if (nextIndex >= papers.length) nextIndex = 0
      return nextIndex
    })
  }

  const getPdfUrl = (url: string | null) => {
    if (!url) return null
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'))) {
       if (url.includes('/uploads/pdfs/')) {
          const match = url.match(/uploads\/pdfs\/.+$/);
          if (match) {
             return `/${match[0]}`;
          }
       }
    }
    if (url.startsWith('http') || url.startsWith('/')) return url
    return `/uploads/pdfs/${url}`
  }

  // Animation Variants
  const trashVariants = {
    initial: { scale: 0, opacity: 0, rotate: 0, y: -50 },
    appear: { 
      scale: 1, 
      opacity: 1, 
      y: -50,
      transition: { type: "spring", stiffness: 200, damping: 20 } 
    },
    shake: {
      rotate: [0, -10, 10, -10, 10, 0],
      y: -50,
      transition: { duration: 0.5, delay: 0.5 }
    },
    exit: { 
      scale: 0, 
      opacity: 0, 
      y: 200,
      transition: { duration: 0.5 } 
    }
  } as any

  const flyOutVariants = {
    hidden: { 
      y: -50,
      x: 0, 
      scale: 0, 
      opacity: 0 
    },
    visible: (i: number) => ({
      y: (Math.random() - 0.5) * 500 - 200, 
      x: (Math.random() - 0.5) * 1000, 
      scale: 0.8 + Math.random() * 0.5, 
      opacity: 1,
      rotate: (Math.random() - 0.5) * 180, 
      transition: { 
        type: "spring",
        stiffness: 60, 
        damping: 8,
        delay: 0.8 + i * 0.05 
      }
    })
  } as any

  // 3D 轮播变体
  const cardStackVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      scale: 0.8,
      opacity: 0,
      zIndex: 0,
      rotateY: direction > 0 ? -45 : 45,
    }),
    center: {
      x: 0,
      scale: 1,
      opacity: 1,
      zIndex: 2,
      rotateY: 0,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      scale: 0.8,
      opacity: 0,
      zIndex: 0,
      rotateY: direction < 0 ? -45 : 45,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }),
  } as any

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  // 渲染 PDF 模式的 3D 轮播
  const renderPDFCarousel = () => {
    const currentPaper = papers[currentPageIndex]
    const pdfUrl = currentPaper ? getPdfUrl(currentPaper.pdfUrl) : null
    
    return (
      <div className="relative w-full max-w-7xl flex-1 flex items-center justify-center perspective-[1200px] min-h-0">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Left Card (Background) */}
          <motion.div
            className="absolute w-[60%] md:w-[40%] aspect-[1/1.414] md:aspect-[16/10] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-border/50 opacity-40 z-0 pointer-events-none"
            initial={false}
            animate={{ 
              x: '-55%', 
              scale: 0.85, 
              rotateY: 25,
              opacity: 0.6,
              zIndex: 0 
            }}
            transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="w-full h-full bg-muted/20 flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-zinc-800 opacity-50" />
            </div>
          </motion.div>

          {/* Right Card (Background) */}
          <motion.div
            className="absolute w-[60%] md:w-[40%] aspect-[1/1.414] md:aspect-[16/10] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-border/50 opacity-40 z-0 pointer-events-none"
            initial={false}
            animate={{ 
              x: '55%', 
              scale: 0.85, 
              rotateY: -25,
              opacity: 0.6,
              zIndex: 0
            }}
            transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="w-full h-full bg-muted/20 flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-zinc-800 opacity-50" />
            </div>
          </motion.div>

          {/* Center Card (Interactive) */}
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            {currentPaper && (
              <motion.div
                key={currentPaper.id}
                custom={direction}
                variants={cardStackVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }: PanInfo) => {
                  const swipe = swipePower(offset.x, velocity.x)
                  if (swipe < -swipeConfidenceThreshold) {
                    paginate(1)
                  } else if (swipe > swipeConfidenceThreshold) {
                    paginate(-1)
                  }
                }}
                className="absolute w-[85%] md:w-[60%] h-[75%] md:h-[85%] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-border/50 flex flex-col z-20"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* PDF / Cover Area */}
                <div className="relative flex-1 bg-muted/10 overflow-hidden group">
                  {pdfUrl ? (
                    <>
                      <iframe 
                        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&page=1`}
                        className="w-full h-full border-none pointer-events-none select-none scale-[1.02] origin-top" 
                        title="Preview"
                      />
                      <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="bg-background/80 backdrop-blur-md text-foreground px-6 py-3 rounded-full shadow-lg font-bold transform scale-90 group-hover:scale-100 transition-transform">
                          阅读全文
                        </div>
                      </div>
                      <Link href={`/novel/${currentPaper.id}`} className="absolute inset-0 z-10" />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30">
                      <FileText className="w-20 h-20 mb-2" />
                      <span className="text-sm">无预览</span>
                    </div>
                  )}
                </div>

                {/* Minimal Meta Footer */}
                <div className="h-auto bg-background/95 backdrop-blur border-t p-4 flex flex-col gap-2">
                  <h3 className="text-xl md:text-2xl font-bold leading-tight line-clamp-1 text-center" title={currentPaper.title}>
                    {currentPaper.title}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-primary">{currentPaper.author}</span>
                    <span>•</span>
                    <span>{currentPaper.category}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={() => paginate(-1)}
          className="absolute left-2 md:left-10 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur text-foreground shadow-lg transition-all z-20 hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => paginate(1)}
          className="absolute right-2 md:right-10 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur text-foreground shadow-lg transition-all z-20 hover:scale-110 active:scale-95"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center">
      
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 opacity-20 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />

      {/* ------------------- SPLASH PHASE ------------------- */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: "none", transition: { duration: 0.8 } }}
          >
            <div className="relative flex flex-col items-center">
              {/* Trash Can */}
              <motion.div
                variants={trashVariants}
                initial="initial"
                animate={cardsThrown ? "shake" : "appear"}
                exit="exit"
                className="relative z-20"
              >
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)]">
                  <Trash2 className="w-16 h-16 md:w-24 md:h-24 text-primary" />
                </div>
                {!cardsThrown && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="absolute -bottom-12 left-0 right-0 text-center font-bold text-muted-foreground"
                  >
                    OpenJunk 正在倒垃圾...
                  </motion.p>
                )}
              </motion.div>

              {/* Flying Cards */}
              {cardsThrown && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-0 h-0">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={`splash-card-${i}`}
                      custom={i}
                      variants={flyOutVariants}
                      initial="hidden"
                      animate="visible"
                      className="absolute w-32 h-44 bg-white rounded-lg shadow-xl border border-border flex items-center justify-center overflow-hidden"
                      style={{ 
                        originX: 0.5, 
                        originY: 1,
                        zIndex: Math.floor(Math.random() * 10) 
                      }} 
                    >
                      <div className="w-full h-full bg-muted/10 p-2 flex flex-col gap-1.5 opacity-50">
                        <div className="h-1/2 bg-muted/40 rounded-sm w-full" />
                        <div className="h-1.5 w-full bg-muted/40 rounded-sm" />
                        <div className="h-1.5 w-4/5 bg-muted/40 rounded-sm" />
                        <div className="h-1.5 w-full bg-muted/40 rounded-sm" />
                        <div className="h-1.5 w-2/3 bg-muted/40 rounded-sm" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------- MAIN DECK PHASE ------------------- */}
      {!showSplash && papers.length > 0 && (
        <motion.div 
          className="relative z-10 w-full h-full flex flex-col items-center justify-start overflow-hidden pb-12 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* News Section */}
          <div className="z-50 w-full flex justify-center mb-2 shrink-0 px-4">
            <NewsSection />
          </div>

          {/* 根据 viewMode 渲染不同的布局 */}
          {viewMode === "cover" ? <BookView papers={papers} /> : renderPDFCarousel()}

          {/* Bottom Navigation */}
          {viewMode === "pdf" && (
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-20 pointer-events-none">
              <div className="flex gap-2 pointer-events-auto">
                {papers.map((_, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setCurrentPageIndex(idx)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          idx === currentPageIndex ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-primary/50"
                        )} 
                      />
                    ))
                }
              </div>

              <p className="text-xs text-muted-foreground animate-pulse">
                左右滑动切换
              </p>
            </div>
          )}

        </motion.div>
      )}
    </div>
  )
}
