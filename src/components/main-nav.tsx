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
        { name: "期刊动态", href: "/journals/trends" },
        { name: "在线投稿", href: "/journals/submission" },
      ]
    },
    {
      name: "会议",
      href: "/conferences",
      children: [
        { name: "会议矩阵", href: "/conferences" },
        { name: "会议论文", href: "/conferences/browse" },
        { name: "会议动态", href: "/conferences/trends" },
        { name: "会议投稿", href: "/conferences/submission" },
      ]
    },
    {
      name: "基金",
      href: "/fund",
      children: [
        { name: "基金申报", href: "/fund" },
        { name: "项目列表", href: "/fund/projects" },
        { name: "查询状态", href: "/fund/check" },
      ]
    },
    { name: "奖项", href: "/awards" },
    { name: "作者", href: "/authors" },
    {
      name: "其它",
      href: "/others",
      children: [
        { name: "Junk宇宙", href: "/universe" },
        { name: "申请NOI", href: "https://webofnothing.org", external: true },
        { name: "关于我们", href: "/about" },
        { name: "联系我们", href: "/contact" },
        { name: "隐私政策", href: "/privacy" },
      ]
    }
  ]

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => {
        if (item.children) {
          return (
            <DropdownMenu key={item.name}>
              <DropdownMenuTrigger className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary focus:outline-none",
                pathname?.startsWith(item.href) && item.href !== "/" ? "text-foreground font-bold" : "text-muted-foreground"
              )}>
                {item.name} <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {item.children.map((child) => (
                  <DropdownMenuItem key={child.name} asChild>
                    <Link href={child.href} target={child.external ? "_blank" : undefined} rel={child.external ? "noopener noreferrer" : undefined}>
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
