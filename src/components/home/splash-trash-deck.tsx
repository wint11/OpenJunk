"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useAnimation, PanInfo } from "framer-motion"
import { Novel } from "@prisma/client"
import { Trash2, FileText, ChevronRight, ChevronLeft, BookOpen, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SplashTrashDeckProps {
  papers: (Novel & {
    journal: { id: string; name: string } | null
  })[]
}

export function SplashTrashDeck({ papers }: SplashTrashDeckProps) {
  const [showSplash, setShowSplash] = useState(true)
  const [cardsThrown, setCardsThrown] = useState(false)
  const controls = useAnimation()
  
  // Card Deck State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Trigger splash sequence on mount
  useEffect(() => {
    const sequence = async () => {
      // 1. Wait a bit (Initial pause before shake)
      await new Promise(r => setTimeout(r, 1000))
      
      // 2. Trash can shake/open animation (handled by variants)
      // 3. Cards fly out
      setCardsThrown(true)
      
      // 4. Wait for fly out animation to finish before removing splash overlay fully
      // Keeping splash screen longer to let users see the trash throwing effect
      await new Promise(r => setTimeout(r, 2000))
      setShowSplash(false)
    }
    sequence()
  }, [])

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentIndex((prev) => {
      let nextIndex = prev + newDirection
      if (nextIndex < 0) nextIndex = papers.length - 1
      if (nextIndex >= papers.length) nextIndex = 0
      return nextIndex
    })
  }

  const currentPaper = papers[currentIndex]
  
  const getPdfUrl = (url: string | null) => {
    if (!url) return null
    if (url.startsWith('http') || url.startsWith('/')) return url
    return `/uploads/pdfs/${url}`
  }
  const pdfUrl = getPdfUrl(currentPaper?.pdfUrl)

    // ------------------------------------------------------------------
    // Animation Variants
    // ------------------------------------------------------------------
  
    // Trash Can Animation
    const trashVariants = {
      initial: { scale: 0, opacity: 0, rotate: 0, y: -50 }, // Move up slightly
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
  
    // Cards Flying Out Animation (Initial)
    // Each card will have a different delay and angle
    const flyOutVariants = {
      hidden: { 
        y: -50, // Match trash can position
        x: 0, 
        scale: 0, 
        opacity: 0 
      },
      visible: (i: number) => ({
        // Scatter around the center (-300 to +300) instead of flying way up
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
  
    // 3-Card Stack Carousel Variants (Coverflow style)
    const cardStackVariants = {
      enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        scale: 0.8,
        opacity: 0,
        zIndex: 0,
        rotateY: direction > 0 ? -45 : 45, // 3D rotation
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
      // Side cards (visible but behind)
      left: {
        x: '-60%',
        scale: 0.85,
        opacity: 0.6,
        zIndex: 1,
        rotateY: 30,
        transition: { duration: 0.5 }
      },
      right: {
        x: '60%',
        scale: 0.85,
        opacity: 0.6,
        zIndex: 1,
        rotateY: -30,
        transition: { duration: 0.5 }
      }
    } as any

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  // Helper to get card at relative index
  const getCardIndex = (offset: number) => {
    let index = currentIndex + offset
    if (index < 0) index = papers.length + index
    if (index >= papers.length) index = index % papers.length
    return index
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

              {/* Flying Cards (Visual only during splash) */}
              {cardsThrown && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-0 h-0">
                  {/* Create an array of 12 items for more trash */}
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
                        // Randomize z-index slightly
                        zIndex: Math.floor(Math.random() * 10) 
                      }} 
                    >
                      {/* Mini Preview Content - Simplified */}
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
      {!showSplash && (
        <motion.div 
          className="relative z-10 w-full h-full flex flex-col items-center justify-center overflow-hidden pb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* 3D Perspective Container */}
          <div className="relative w-full max-w-7xl flex-1 flex items-center justify-center perspective-[1200px]">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              {/* Render 3 cards: Previous, Current, Next */}
              {[-1, 0, 1].map((offset) => {
                const index = getCardIndex(offset)
                const paper = papers[index]
                if (!paper) return null

                const isCenter = offset === 0
                const variant = isCenter ? 'center' : (offset < 0 ? 'left' : 'right')
                
                // For AnimatePresence to work correctly with swiping, we need to be careful with keys
                // But for a simple carousel, re-rendering with updated positions works best if we animate 'layout' or x/scale
                // Here we use absolute positioning and motion variants
                
                // Actual PDF url for this card
                const thisPdfUrl = getPdfUrl(paper.pdfUrl)

                return (
                  <motion.div
                    key={`${paper.id}-${offset}`} // Key includes offset to force re-mount/animate on position change? 
                    // Actually, for smooth transitions, we want the card that WAS right to BECOME center.
                    // So key should be just paper.id. 
                    // BUT, we are rendering 3 distinct slots.
                    // Let's try rendering just the Current one with AnimatePresence for enter/exit, 
                    // and manually placing the side ones? 
                    // The user wants "stacking effect... left to center... right to center".
                    // A true carousel needs track logic. 
                    
                    // Simplified approach for "Coverflow":
                    // Render ALL cards (or a window) and animate their properties based on distance from current index.
                  />
                )
              })}
              
              {/* 
                 Better Approach: Render the center card with AnimatePresence for swipe in/out,
                 AND render the "background" cards statically (or animated) based on current index.
              */}
            </AnimatePresence>
            
            {/* 
              Re-implementing logic:
              We need a container that holds the cards. 
              Let's render a "window" of cards.
            */}
             
             <div className="relative w-full h-full flex items-center justify-center">
                {/* Left Card (Background) */}
                <motion.div
                   key={`left-${getCardIndex(-1)}`}
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
                   {/* Content placeholder */}
                   <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                      <div className="w-full h-full bg-white dark:bg-zinc-800 opacity-50" />
                   </div>
                </motion.div>

                {/* Right Card (Background) */}
                <motion.div
                   key={`right-${getCardIndex(1)}`}
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
                  <motion.div
                    key={currentIndex}
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
                </AnimatePresence>
             </div>

          </div>

          {/* Navigation Arrows (Floating) */}
          <button 
              onClick={() => paginate(-1)}
              className="absolute left-2 md:left-10 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur text-foreground shadow-lg transition-all z-20 hover:scale-110 active:scale-95 pointer-events-auto"
          >
              <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
              onClick={() => paginate(1)}
              className="absolute right-2 md:right-10 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur text-foreground shadow-lg transition-all z-20 hover:scale-110 active:scale-95 pointer-events-auto"
          >
              <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom Navigation */}
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-20 pointer-events-none">
             {/* Pagination Dots */}
             <div className="flex gap-2 pointer-events-auto">
                 {papers.map((_, idx) => (
                    <button 
                       key={idx} 
                       onClick={() => {
                         setDirection(idx > currentIndex ? 1 : -1)
                         setCurrentIndex(idx)
                       }}
                       className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          idx === currentIndex ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-primary/50"
                       )} 
                    />
                 ))}
             </div>

             <p className="text-xs text-muted-foreground animate-pulse">
                左右滑动切换
             </p>
          </div>

        </motion.div>
      )}
    </div>
  )
}
