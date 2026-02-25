"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface ReaderViewProps {
  chapter: {
    id: string
    title: string
    content: string
    order: number
    isVip?: boolean
    novel: {
      id: string
      title: string
    }
  }
  chapters: Array<{
    id: string
    title: string
    order: number
    content: string
    isVip?: boolean
  }>
}

const THEMES = [
  { name: "light", label: "白昼", bg: "bg-white", text: "text-zinc-900" },
  { name: "sepia", label: "护眼", bg: "bg-[#f4ecd8]", text: "text-[#5b4636]" },
  { name: "dark", label: "夜间", bg: "bg-zinc-950", text: "text-zinc-300" },
]

export function ReaderView({ chapter, chapters }: ReaderViewProps) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [fontSize, setFontSize] = React.useState(18)
  const [theme, setTheme] = React.useState("light")
  const [mounted, setMounted] = React.useState(false)
  const [isLoadingNext, setIsLoadingNext] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(true)
  const [activeChapterId, setActiveChapterId] = React.useState(chapter.id)
  
  // Refs for scrolling and sync
  const contentScrollRef = React.useRef<HTMLDivElement | null>(null)
  const chapterNavRef = React.useRef<HTMLDivElement | null>(null)
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null)
  const loadPrevRef = React.useRef<HTMLDivElement | null>(null)
  
  // Logic refs
  const isLoadingNextRef = React.useRef(false)
  const isLoadingPrevRef = React.useRef(false)
  const hasMoreRef = React.useRef(true)
  const hasPrevRef = React.useRef(true)
  const lastChapterIdRef = React.useRef(chapter.id)
  const firstChapterIdRef = React.useRef(chapter.id)
  const headingElsRef = React.useRef(new Map<string, HTMLElement>())
  
  // Sync control refs
  const isSyncingNavRef = React.useRef(false)
  const isSyncingContentRef = React.useRef(false)
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const prevScrollHeightRef = React.useRef(0)
  const isPrependingRef = React.useRef(false)
  const hasInitialScrolled = React.useRef(false)

  // Initialize with surrounding chapters (e.g., +/- 2 chapters)
  const getInitialChapters = () => {
    const currentIndex = chapters.findIndex(c => c.id === chapter.id)
    if (currentIndex === -1) return [chapter]

    const start = Math.max(0, currentIndex - 2)
    const end = Math.min(chapters.length, currentIndex + 3) // Exclusive end
    
    return chapters.slice(start, end).map(c => ({
      ...c,
      content: c.content || ""
    }))
  }

  const [loadedChapters, setLoadedChapters] = React.useState<Array<{
    id: string
    title: string
    content: string
    order: number
    isVip?: boolean
  }>>(getInitialChapters)

  // Initial Scroll Position
  React.useLayoutEffect(() => {
    if (hasInitialScrolled.current) return
    
    const el = headingElsRef.current.get(chapter.id)
    if (el) {
       el.scrollIntoView({ behavior: "auto", block: "start" })
       hasInitialScrolled.current = true
    } else if (loadedChapters.length > 0 && loadedChapters[0].id === chapter.id) {
        // If current is first loaded, and el is not ready (rare in useLayoutEffect), or just top
        // contentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" })
        hasInitialScrolled.current = true
    }
  })

  // Handle scroll adjustment after prepending chapters
  React.useLayoutEffect(() => {
    if (isPrependingRef.current) {
      const scrollEl = contentScrollRef.current
      if (scrollEl) {
        const newScrollHeight = scrollEl.scrollHeight
        const diff = newScrollHeight - prevScrollHeightRef.current
        if (diff > 0) {
            scrollEl.scrollTop += diff
        }
      }
      isPrependingRef.current = false
    }
  }, [loadedChapters])

  // Constants for Chapter Tree
  const TREE_ITEM_HEIGHT = 32
  const TREE_VISIBLE_ITEMS = 9 // 1 faded + 7 active + 1 faded
  const TREE_HEIGHT = TREE_ITEM_HEIGHT * TREE_VISIBLE_ITEMS

  // Load settings
  React.useEffect(() => {
    setMounted(true)
    const savedSize = localStorage.getItem("reader-font-size")
    const savedTheme = localStorage.getItem("reader-theme")
    
    if (savedSize) setFontSize(parseInt(savedSize))

    if (savedTheme) {
      setTheme(savedTheme)
    } else if (resolvedTheme === "dark") {
      setTheme("dark")
    }
  }, [resolvedTheme])

  // Lock body scroll
  React.useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])

  const currentTheme = THEMES.find(t => t.name === theme) || THEMES[0]

  // --- Synchronization Logic ---

  // Scroll Tree to Active Chapter
  const scrollTreeToActive = React.useCallback((id: string, smooth: boolean = true) => {
    const nav = chapterNavRef.current
    if (!nav) return

    const target = nav.querySelector<HTMLElement>(`[data-chapter-nav-id="${id}"]`)
    if (!target) return

    const navRect = nav.getBoundingClientRect()
    const targetTop = target.offsetTop
    // Center the item: targetTop - (viewportHeight / 2) + (itemHeight / 2)
    const scrollTop = targetTop - (navRect.height / 2) + (target.clientHeight / 2)

    nav.scrollTo({
      top: scrollTop,
      behavior: smooth ? "smooth" : "auto"
    })
  }, [])

  // 1. Sync: Content Scroll -> Update Active ID -> Scroll Tree
  React.useEffect(() => {
    const els = Array.from(headingElsRef.current.entries())
      .map(([, el]) => el)
      .filter(Boolean)
    if (els.length === 0) return
    const root = contentScrollRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (isSyncingContentRef.current) return // Ignore updates if we are scrolling content programmatically

        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return

        // Find the topmost visible heading
        let best: IntersectionObserverEntry | null = null
        for (const e of visible) {
          if (!best || e.boundingClientRect.top < best.boundingClientRect.top) {
            best = e
          }
        }
        
        if (best) {
          const id = (best.target as HTMLElement).dataset.chapterId
          if (id && id !== activeChapterId) {
             // We update state, but we need to mark that this update comes from scroll
             // actually standard state update is fine, the useEffect on activeChapterId will handle tree scroll
             setActiveChapterId(id)
          }
        }
      },
      { root, rootMargin: "-10% 0px -80% 0px", threshold: 0 }
    )

    for (const el of els) observer.observe(el)
    return () => observer.disconnect()
  }, [loadedChapters, activeChapterId])

  // 2. Effect: activeChapterId changed -> Scroll Tree & Update URL
  React.useEffect(() => {
    // Update URL without navigation (to avoid re-rendering/resetting state)
    const newUrl = `/novel/${chapter.novel.id}/chapter/${activeChapterId}`
    if (window.location.pathname !== newUrl) {
      window.history.replaceState(null, "", newUrl)
    }

    if (isSyncingContentRef.current) return // If change was due to tree click, tree is already handling or we don't want to fight
    
    // If change came from content scroll (IntersectionObserver), we smooth scroll tree
    // We use a flag to prevent circular dependency if tree scroll triggers something (it shouldn't)
    isSyncingNavRef.current = true
    scrollTreeToActive(activeChapterId, true)
    
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      isSyncingNavRef.current = false
    }, 500)

  }, [activeChapterId, scrollTreeToActive, chapter.novel.id])

  // 3. Handle Tree Item Click
  const handleChapterClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault() // Prevent default anchor jump
    
    // Update active state immediately
    setActiveChapterId(id)
    
    // Scroll Tree to Center (Visual feedback)
    scrollTreeToActive(id, true)

    // Scroll Content
    const heading = headingElsRef.current.get(id)
    if (heading) {
      isSyncingContentRef.current = true
      // Use center alignment to ensure the heading falls within the Observer's visible area
    // and provides better visual context for the jump
    heading.scrollIntoView({ behavior: "smooth", block: "start" })
    
    // Reset flag after animation
      setTimeout(() => {
        isSyncingContentRef.current = false
      }, 1000)
    } else {
      // Not loaded, load from local props
      const targetChapter = chapters.find(c => c.id === id)
      if (targetChapter && targetChapter.content) {
         setLoadedChapters([{ ...targetChapter, content: targetChapter.content! }])
         
         // Reset infinite scroll state
         setHasMore(true)
         hasMoreRef.current = true
         hasPrevRef.current = true
         isLoadingNextRef.current = false
         setIsLoadingNext(false)
         isLoadingPrevRef.current = false
         
         // Scroll to top
         // Use setTimeout to ensure render happens first
         setTimeout(() => {
            contentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" })
         }, 0)
      } else {
         router.push(`/novel/${chapter.novel.id}/chapter/${id}`)
      }
    }
  }

  // --- Infinite Scroll Logic (Preserved) ---
  
  React.useEffect(() => {
    // Reset when chapter prop changes (initial load of new page)
    setLoadedChapters(getInitialChapters())
    hasInitialScrolled.current = false
    setHasMore(true)
    hasMoreRef.current = true
    hasPrevRef.current = true
    // lastChapterIdRef/firstChapterIdRef will update in effect
    isLoadingNextRef.current = false
    setIsLoadingNext(false)
    isLoadingPrevRef.current = false
    
    // Initial scroll is handled by useLayoutEffect now
  }, [chapter.id, chapter.novel.id, chapter.title, chapter.content, chapter.order]) // minimal deps

  // Update refs when loadedChapters change
  React.useEffect(() => {
    lastChapterIdRef.current = loadedChapters[loadedChapters.length - 1]?.id ?? chapter.id
    firstChapterIdRef.current = loadedChapters[0]?.id ?? chapter.id
  }, [loadedChapters, chapter.id])

  const loadNextChapter = React.useCallback(async () => {
    if (isLoadingNextRef.current || !hasMoreRef.current) return
    
    isLoadingNextRef.current = true
    setIsLoadingNext(true)
    
    setLoadedChapters((prev) => {
        const lastId = prev[prev.length - 1].id
        const currentIndex = chapters.findIndex(c => c.id === lastId)
        const nextChapter = chapters[currentIndex + 1]

        if (!nextChapter || !nextChapter.content) {
            console.log("No next chapter or content missing")
            // We can't update hasMoreRef directly inside, but we can detect it later
            // For now, just return prev
            return prev
        }

        if (prev.some((c) => c.id === nextChapter.id)) return prev
        return [...prev, { ...nextChapter, content: nextChapter.content! }]
    })

    // Update flags based on new state in next render or just assume done
    setIsLoadingNext(false)
    isLoadingNextRef.current = false
    
    // Check if we reached end
    const lastId = loadedChapters[loadedChapters.length - 1]?.id
    const currentIndex = chapters.findIndex(c => c.id === lastId)
    if (currentIndex >= chapters.length - 1) {
        setHasMore(false)
        hasMoreRef.current = false
    }
  }, [chapters, loadedChapters])

  const loadPrevChapter = React.useCallback(async () => {
    if (isLoadingPrevRef.current || !hasPrevRef.current) return
    
    console.log("Loading prev chapter...")
    isLoadingPrevRef.current = true
    
    setLoadedChapters((prev) => {
        const firstId = prev[0].id
        const currentIndex = chapters.findIndex(c => c.id === firstId)
        console.log("Current first:", firstId, "Index:", currentIndex)
        const prevChapter = chapters[currentIndex - 1]

        if (!prevChapter || !prevChapter.content) {
            console.log("No prev chapter")
            hasPrevRef.current = false
            // Force update to trigger effect and unlock
            return [...prev]
        }

        if (prev.some(c => c.id === prevChapter.id)) {
            console.log("Duplicate prev chapter")
            // Force update to trigger effect and unlock
            return [...prev]
        }

        console.log("Adding prev chapter:", prevChapter.title)

        // Capture scroll height for adjustment
        const scrollEl = contentScrollRef.current
        if (scrollEl) {
            prevScrollHeightRef.current = scrollEl.scrollHeight
            isPrependingRef.current = true
        }

        return [{ ...prevChapter, content: prevChapter.content! }, ...prev]
    })
  }, [chapters])

  // Reset loading flags after render
  React.useEffect(() => {
      // Delay unlocking to ensure IntersectionObserver has time to update its state
      // after the scroll adjustment (useLayoutEffect) has moved the sentinel out of view.
      const timer = setTimeout(() => {
          isLoadingNextRef.current = false
          isLoadingPrevRef.current = false
      }, 500)
      return () => clearTimeout(timer)
  }, [loadedChapters])

  // 4. Scroll Event Listener (Backup for IntersectionObserver)
  const handleScroll = React.useCallback(() => {
    const el = contentScrollRef.current
    if (!el) return

    const { scrollTop, scrollHeight, clientHeight } = el
    // If we are close to bottom (e.g. within 500px), try to load next
    if (scrollHeight - scrollTop - clientHeight < 500) {
      if (!isLoadingNextRef.current && hasMoreRef.current) {
        console.log("Scroll trigger loading next")
        loadNextChapter()
      }
    }
    
    // Disabled manual prev loading to avoid conflict with IntersectionObserver
    // and double-triggering issues.
    /*
    if (scrollTop < 500) { 
       if (!isLoadingPrevRef.current && hasPrevRef.current) {
         console.log("Scroll trigger loading prev")
         loadPrevChapter()
       }
    }
    */
  }, [loadNextChapter])

  // Observers for Infinite Scroll
  React.useEffect(() => {
    const el = loadMoreRef.current
    // Use viewport as root (null) to avoid ref issues, and set large margin
    // This means as soon as the element is within 400px of the viewport bottom, it triggers
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          console.log("Observer trigger loading next")
          loadNextChapter()
        }
      },
      { root: null, rootMargin: "0px 0px 400px 0px", threshold: 0 } 
    )
    
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [loadNextChapter])

  React.useEffect(() => {
    const el = loadPrevRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadPrevChapter()
      },
      { root: null, rootMargin: "100px 0px 0px 0px", threshold: 0 }
    )
    // Delay observation to avoid initial trigger on fresh load
    const timer = setTimeout(() => {
        observer.observe(el)
    }, 1000)
    
    return () => {
        clearTimeout(timer)
        observer.disconnect()
    }
  }, [loadPrevChapter])

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }
  
  return (
    <div className={cn("h-[calc(100vh-64px)] overflow-hidden relative select-none", currentTheme.bg)}>
      <div className="relative w-full h-full flex justify-center">
        {/* Chapter Tree Sidebar - Anchored to Center */}
        <div 
          className="fixed top-1/2 -translate-y-1/2 z-40 hidden lg:block select-none pointer-events-none"
          style={{ 
             height: TREE_HEIGHT,
             // Position relative to center: center - 50% width of content (approx 384px) - sidebar width - spacing
             // Content max-width is 3xl (48rem = 768px). 
             // Center is 50vw. Left edge of content is 50vw - 384px.
             // We want sidebar to be left of that.
             left: 'calc(50vw - 384px - 180px)', 
             width: '160px',
             pointerEvents: 'auto'
          }}
        >
          {/* Mask for fading top/bottom */}
          <div 
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, 
                ${theme === 'dark' ? 'rgba(9,9,11,1)' : 'rgba(255,255,255,1)'} 0%, 
                transparent 15%, 
                transparent 85%, 
                ${theme === 'dark' ? 'rgba(9,9,11,1)' : 'rgba(255,255,255,1)'} 100%)`
            }}
          />
          
          {/* Scroll Container */}
          <div 
            ref={chapterNavRef}
            className="h-full overflow-y-auto reader-scrollbar-hidden pr-4"
            style={{ scrollBehavior: 'auto' }} // We handle smooth scroll manually or via class
          >
            {/* Vertical Line */}
            <div className={cn(
              "absolute left-[13.5px] top-0 bottom-0 w-px",
              theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
            )} />
            
            <div className="relative py-[128px]"> {/* Padding to allow first/last items to be centered (approx 4 items * 32px) */}
              {chapters.map((c) => {
                const isCurrent = c.id === activeChapterId

                return (
                  <Link
                    key={c.id}
                    href={`/novel/${chapter.novel.id}/chapter/${c.id}`}
                    onClick={(e) => handleChapterClick(e, c.id)}
                    data-chapter-nav-id={c.id}
                    className={cn(
                      "group relative flex items-center gap-3 px-2 transition-all duration-300",
                      isCurrent ? "opacity-100" : "opacity-80 hover:opacity-100"
                    )}
                    style={{ height: TREE_ITEM_HEIGHT }}
                  >
                    <span className={cn(
                      "relative z-10 size-3 rounded-full border-2 transition-all",
                      isCurrent 
                        ? "bg-primary border-primary scale-110" 
                        : theme === "dark" ? "bg-zinc-950 border-zinc-700 group-hover:border-zinc-500" : "bg-white border-zinc-300 group-hover:border-zinc-400"
                    )} />
                    <span className={cn(
                      "truncate text-sm transition-all",
                      isCurrent 
                        ? cn(currentTheme.text, "font-bold scale-105 origin-left") 
                        : "text-zinc-400 font-normal"
                    )}>
                      {c.title}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div 
          className="h-full w-full relative"
        >
           {/* Container for centering content */}
          <div 
            ref={contentScrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto reader-scrollbar-hidden overscroll-contain"
          >
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-full">
              <div ref={loadPrevRef} className="h-1 w-full" />
              
              <article className="prose prose-lg mx-auto max-w-none dark:prose-invert select-text">
                {loadedChapters.map((c) => (
                  <div 
                    key={c.id} 
                    className="mb-20 scroll-mt-24"
                    data-chapter-id={c.id}
                    ref={(el) => {
                      if (el) headingElsRef.current.set(c.id, el)
                      else headingElsRef.current.delete(c.id)
                    }}
                  >
                    <h1
                      className={cn(
                        "mb-2 text-center text-3xl font-bold tracking-tight md:text-4xl select-none cursor-text",
                        currentTheme.text
                      )}
                      data-text={c.title}
                    >
                      {c.title}
                    </h1>
                    
                    {c.isVip ? (
                      <div className="relative paywall-container">
                        <div 
                          className={cn(
                             "paywall-blur select-none pointer-events-none whitespace-pre-wrap leading-loose tracking-wide font-sans text-justify",
                             currentTheme.text
                          )}
                          style={{ fontSize: `${fontSize}px`, lineHeight: "1.8" }}
                        >
                           {c.content}
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px] z-10 paywall-overlay">
                           <div className="text-2xl font-bold mb-2">🔒 需订阅访问</div>
                           <div className="text-muted-foreground">请订阅本期刊以阅读全文。</div>
                        </div>
                      </div>
                    ) : c.content.includes("paywall-container") ? (
                      <div
                        className={cn(
                          "leading-loose tracking-wide font-sans text-justify",
                          currentTheme.text
                        )}
                        style={{ fontSize: `${fontSize}px`, lineHeight: "1.8" }}
                        dangerouslySetInnerHTML={{ __html: c.content }}
                      />
                    ) : (
                      <div
                        className={cn(
                          "whitespace-pre-wrap leading-loose tracking-wide font-sans text-justify",
                          currentTheme.text
                        )}
                        style={{ fontSize: `${fontSize}px`, lineHeight: "1.8" }}
                      >
                        {c.content}
                      </div>
                    )}
                    
                    <div className={cn("mt-12 h-px w-full", theme === "dark" ? "bg-zinc-800" : "bg-zinc-200")} />
                  </div>
                ))}
              </article>

              <div className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground">
                {isLoadingNext ? <span>正在加载下一章…</span> : null}
                {!hasMore ? <span>已到最后一章</span> : null}
              </div>
              <div ref={loadMoreRef} className="h-1 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
