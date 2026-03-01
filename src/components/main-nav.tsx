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
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export function MainNav({ role }: { role?: string }) {
  const pathname = usePathname()

  const navItems = [
    { name: "首页", href: "/" },
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
        // { name: "奖项动态", href: "/awards/trends" },
        { name: "申请奖项", href: "/awards/application" },
        { name: "创办奖项", href: "/awards/new" },
      ]
    },
    {
      name: "发现",
      href: "/discovery",
      children: [
        { name: "预印本", href: "/preprints" },
        { name: "Junk宇宙", href: "/universe" },
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
        { name: "没用科学院", href: "https://caonu.labbricker.com/", external: true },
      ]
    }
  ]

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => {
        if (item.children) {
          return (
            <DropdownMenu key={item.name} modal={false}>
              <DropdownMenuTrigger suppressHydrationWarning className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary focus:outline-none",
                pathname?.startsWith(item.href) && item.href !== "/" ? "text-foreground font-bold" : "text-muted-foreground"
              )}>
                {item.name} <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {item.children.map((child) => (
                  <DropdownMenuItem key={child.name} asChild>
                    <Link 
                      href={child.href} 
                      target={'external' in child && child.external ? "_blank" : undefined} 
                      rel={'external' in child && child.external ? "noopener noreferrer" : undefined}
                    >
                        {child.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href ? "text-foreground font-bold" : "text-muted-foreground"
            )}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
