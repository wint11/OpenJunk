'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"

export function MainNav({ role }: { role?: string }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  const navItems = [
    {
      name: "期刊",
      href: "/journals",
      children: [
        { name: "期刊矩阵", href: "/journals" },
        { name: "期刊论文", href: "/journals/browse" },
        { name: "在线投稿", href: "/journals/submission" },
        { name: "创办期刊", href: "/journals/new" },
      ]
    },
    {
      name: "会议",
      href: "/conferences",
      children: [
        { name: "会议矩阵", href: "/conferences" },
        { name: "会议论文", href: "/conferences/browse" },
        { name: "会议投稿", href: "/conferences/submission" },
        { name: "创办会议", href: "/conferences/new" },
      ]
    },
    {
      name: "基金",
      href: "/fund",
      children: [
        { name: "基金申报", href: "/fund" },
        { name: "组织介绍", href: "/fund/organization" },
        { name: "项目列表", href: "/fund/projects" },
        { name: "查询状态", href: "/fund/check" },
      ]
    },
    {
      name: "奖项",
      href: "/awards",
      children: [
        { name: "奖项矩阵", href: "/awards" },
        { name: "申请奖项", href: "/awards/application" },
        { name: "创办奖项", href: "/awards/new" },
      ]
    },
    {
      name: "评审",
      href: "/public-review",
      children: [
        { name: "期刊评审", href: "/public-review/journals" },
        { name: "会议评审", href: "/public-review/conferences" },
        { name: "基金评审", href: "/public-review/fund" },
        { name: "奖项评审", href: "/public-review/awards" },
      ]
    },
    {
      name: "发现",
      href: "/discovery",
      children: [
        { name: "Junk宇宙", href: "/universe" },
        { name: "排版工具", href: "/discovery/typesetting" },
        { name: "关于我们", href: "/about" },
      ]
    },
    {
      name: "友链",
      href: "/links",
      children: [
        { name: "Gaggle Scholar", href: "http://47.100.93.220:5000", external: true },
        { name: "Web of Nothing", href: "https://webofnothing.org", external: true },
        { name: "Web of Absurd", href: "https://tctco.github.io/Web-of-Absurd/", external: true },
        { name: "rubbishjournal", href: "https://rubbishjournal.org/zh", external: true },
        { name: "没用科学院", href: "https://caonu.labbricker.com/", external: true },
        { 
          name: "热门期刊导航", 
          href: "/hots", 
          external: true,
          children: [
            { name: "RUBBISH", href: "https://www.rubbish.press/", external: true },
            { name: "S.H.I.T.", href: "https://shitjournal.org/", external: true },
            { name: "Joker Of Academic", href: "https://jokerofacademics.com/", external: true },
            { name: "HELL", href: "https://hellpress.org/", external: true },
          ]
        },
      ]
    }
  ] as const

  // 汉堡菜单中的导航项渲染
  const renderMobileNavItem = (item: typeof navItems[number]) => {
    if (item.children) {
      return (
        <div key={item.name} className="space-y-2">
          <div className="font-medium text-sm text-muted-foreground px-2">
            {item.name}
          </div>
          <div className="pl-4 space-y-1">
            {item.children.map((child) => {
              if ('children' in child && child.children) {
                return (
                  <div key={child.name} className="space-y-1">
                    <div className="text-sm text-muted-foreground px-2">
                      {child.name}
                    </div>
                    <div className="pl-4 space-y-1">
                      {child.children.map((grandChild: any) => (
                        <Link
                          key={grandChild.name}
                          href={grandChild.href}
                          target={'external' in grandChild && grandChild.external ? "_blank" : undefined}
                          className="block px-2 py-1.5 text-sm hover:bg-accent rounded-md"
                          onClick={() => setIsOpen(false)}
                        >
                          {grandChild.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              }
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  target={'external' in child && child.external ? "_blank" : undefined}
                  className="block px-2 py-1.5 text-sm hover:bg-accent rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  {child.name}
                </Link>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "block px-2 py-2 text-sm font-medium rounded-md",
          pathname?.startsWith(item.href) 
            ? "bg-accent text-foreground" 
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        onClick={() => setIsOpen(false)}
      >
        {item.name}
      </Link>
    )
  }

  return (
    <>
      {/* 桌面端导航 - 在中等屏幕以上显示 */}
      <nav className="hidden lg:flex items-center space-x-1 xl:space-x-4">
        {navItems.map((item) => {
          if (item.children) {
            return (
              <DropdownMenu key={item.name} modal={false}>
                <DropdownMenuTrigger 
                  suppressHydrationWarning 
                  className={cn(
                    "flex items-center px-2 py-1.5 text-sm font-medium transition-colors hover:text-primary focus:outline-none rounded-md",
                    pathname?.startsWith(item.href) 
                      ? "text-foreground font-bold bg-accent/50" 
                      : "text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  {item.name} <ChevronDown className="ml-1 h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {item.children.map((child) => {
                    if ('children' in child && child.children) {
                      return (
                        <DropdownMenuSub key={child.name}>
                          <DropdownMenuSubTrigger className="flex items-center justify-between">
                            <span>{child.name}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-48">
                            {child.children.map((grandChild: any) => (
                              <DropdownMenuItem key={grandChild.name} asChild>
                                <Link 
                                  href={grandChild.href} 
                                  target={'external' in grandChild && grandChild.external ? "_blank" : undefined}
                                >
                                  {grandChild.name}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )
                    }
                    
                    return (
                      <DropdownMenuItem key={child.name} asChild>
                        <Link 
                          href={child.href} 
                          target={'external' in child && child.external ? "_blank" : undefined}
                        >
                          {child.name}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "px-2 py-1.5 text-sm font-medium transition-colors hover:text-primary rounded-md",
                pathname?.startsWith(item.href) 
                  ? "text-foreground font-bold bg-accent/50" 
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* 移动端汉堡菜单 - 在中等屏幕以下显示 */}
      <div className="lg:hidden" suppressHydrationWarning>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
              <span className="sr-only">打开菜单</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
            <SheetTitle className="sr-only">导航菜单</SheetTitle>
            <SheetDescription className="sr-only">网站主要导航链接</SheetDescription>
            <div className="flex flex-col h-full">
              {/* 菜单标题 */}
              <div className="border-b p-6 pb-4 flex-shrink-0">
                <h2 className="text-lg font-bold">导航菜单</h2>
                <p className="text-sm text-muted-foreground">浏览网站各个板块</p>
              </div>
              {/* 可滚动内容区域 */}
              <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
                {navItems.map(renderMobileNavItem)}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
