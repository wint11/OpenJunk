"use client"

import { useState } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { Novel } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, FileText, ChevronRight, Download, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PaperDeckProps {
  papers: (Novel & {
    journal: { id: string; name: string } | null
  })[]
}

// 颜色生成器，为了让每张卡片背景略有不同（如果没有封面）
const gradients = [
  "bg-gradient-to-br from-rose-100 to-teal-100",
  "bg-gradient-to-br from-blue-100 to-indigo-100",
  "bg-gradient-to-br from-orange-100 to-rose-100",
  "bg-gradient-to-br from-emerald-100 to-cyan-100",
  "bg-gradient-to-br from-violet-100 to-fuchsia-100",
]

export function PaperDeck({ papers }: PaperDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // 处理滑动/切换逻辑
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
  
  // 处理 PDF URL
  const getPdfUrl = (url: string | null) => {
    if (!url) return null
    if (url.startsWith('http') || url.startsWith('/')) return url
    return `/uploads/pdfs/${url}`
  }
  
  const pdfUrl = getPdfUrl(currentPaper.pdfUrl)
  
  // 卡片变体动画
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
      rotateY: direction < 0 ? 45 : -45,
      transition: {
        duration: 0.5,
      }
    })
  } as any

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background flex flex-col md:flex-row">
      {/* 模糊背景层 */}
      <div className="absolute inset-0 z-0">
         <div className={cn(
            "absolute inset-0 transition-colors duration-1000 opacity-30",
            gradients[currentIndex % gradients.length]
         )} />
         {/* 网格纹理 */}
         <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      {/* 左侧：信息展示区 (40%) */}
      <div className="relative z-10 w-full md:w-[40%] h-[40vh] md:h-full flex flex-col justify-center p-8 md:p-16 space-y-8 bg-background/60 backdrop-blur-md border-b md:border-r border-border/50">
         <motion.div 
            key={currentPaper.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
         >
            <div className="flex flex-wrap gap-2 items-center">
               <Badge variant="outline" className="text-sm px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                  {currentPaper.category}
               </Badge>
               {currentPaper.journal && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                     {currentPaper.journal.name}
                  </Badge>
               )}
               <span className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {currentPaper.views}
               </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
               {currentPaper.title}
            </h1>

            <div className="flex items-center gap-2 text-muted-foreground font-medium">
               <span>{currentPaper.author}</span>
               <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
               <span>{new Date(currentPaper.createdAt).toLocaleDateString()}</span>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed line-clamp-4 md:line-clamp-6">
               {currentPaper.description || "暂无摘要"}
            </p>

            <div className="flex gap-4 pt-4">
               <Button size="lg" className="h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all" asChild>
                  <Link href={`/novel/${currentPaper.id}`}>
                     <BookOpen className="mr-2 h-5 w-5" />
                     阅读全文
                  </Link>
               </Button>
               {pdfUrl && (
                  <Button size="lg" variant="outline" className="h-12 px-6" asChild>
                     <a href={pdfUrl} download>
                        <Download className="mr-2 h-5 w-5" />
                        下载 PDF
                     </a>
                  </Button>
               )}
            </div>
         </motion.div>

         {/* 底部导航控制 */}
         <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center">
            <div className="flex gap-2">
               {papers.map((_, idx) => (
                  <button
                     key={idx}
                     onClick={() => {
                        setDirection(idx > currentIndex ? 1 : -1)
                        setCurrentIndex(idx)
                     }}
                     className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        idx === currentIndex ? "w-8 bg-primary" : "bg-muted-foreground/30 hover:bg-primary/50"
                     )}
                  />
               ))}
            </div>
            <div className="flex gap-2">
               <Button variant="ghost" size="icon" onClick={() => paginate(-1)} className="rounded-full hover:bg-primary/10">
                  <ArrowRight className="h-6 w-6 rotate-180" />
               </Button>
               <Button variant="ghost" size="icon" onClick={() => paginate(1)} className="rounded-full hover:bg-primary/10">
                  <ArrowRight className="h-6 w-6" />
               </Button>
            </div>
         </div>
      </div>

      {/* 右侧：3D 卡片堆叠展示区 (60%) */}
      <div className="relative z-0 w-full md:w-[60%] h-[60vh] md:h-full flex items-center justify-center overflow-hidden perspective-1000">
         <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
               key={currentIndex}
               custom={direction}
               variants={variants}
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
               className="absolute w-[80%] max-w-[600px] aspect-[1/1.414] bg-white rounded-xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-border/20"
               style={{
                  transformStyle: "preserve-3d",
               }}
            >
               {/* 封面/PDF 预览 */}
               {pdfUrl ? (
                  <div className="w-full h-full relative group">
                     {/* 使用 iframe 模拟 PDF 封面效果 (第一页) */}
                     {/* 注意：为了防止 iframe 捕获鼠标事件导致无法拖拽，我们在上面覆盖一层透明 div */}
                     <iframe 
                        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&page=1`}
                        className="w-full h-full border-none pointer-events-none select-none"
                        title="PDF Preview"
                     />
                     
                     {/* 装饰性阴影和光泽 */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
                     <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/40 to-transparent pointer-events-none" />
                     
                     {/* 悬停提示 */}
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium flex items-center gap-2">
                           <Eye className="h-4 w-4" /> 点击查看详情
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className={cn(
                     "w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 bg-muted/20",
                     gradients[currentIndex % gradients.length]
                  )}>
                     <FileText className="h-24 w-24 mb-4" />
                     <p className="font-medium text-lg">暂无预览</p>
                  </div>
               )}
            </motion.div>
         </AnimatePresence>
         
         {/* 背景装饰：模拟后面的卡片 */}
         <div className="absolute w-[75%] max-w-[560px] aspect-[1/1.414] bg-white/50 rounded-xl shadow-xl -z-10 translate-x-4 translate-y-4 md:translate-x-8 md:translate-y-8 blur-[1px] opacity-60" />
         <div className="absolute w-[70%] max-w-[520px] aspect-[1/1.414] bg-white/30 rounded-xl shadow-lg -z-20 translate-x-8 translate-y-8 md:translate-x-16 md:translate-y-16 blur-[2px] opacity-30" />
      </div>
    </div>
  )
}
