'use client'

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useState } from "react"

interface ProjectFilterProps {
  categories: { id: string, name: string }[]
  years: number[]
}

export function ProjectFilter({ categories, years }: ProjectFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "all")
  const [year, setYear] = useState(searchParams.get("year") || "all")
  const [search, setSearch] = useState(searchParams.get("search") || "")

  function handleSearch() {
    const params = new URLSearchParams()
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId)
    if (year && year !== "all") params.set("year", year)
    if (search) params.set("search", search)
    router.push(`?${params.toString()}`)
  }

  function handleReset() {
    setCategoryId("all")
    setYear("all")
    setSearch("")
    router.push("?")
  }

  return (
    <div className="flex flex-wrap gap-4 items-end bg-muted/20 p-4 rounded-md mb-6">
      <div className="grid gap-2">
        <div className="text-sm font-medium">所属基金</div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="所有基金" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有基金</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-medium">年度</div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="所有年度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有年度</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>{y}年</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 flex-1 min-w-[300px]">
        <div className="text-sm font-medium">关键词搜索</div>
        <div className="flex gap-2">
            <Input 
                placeholder="搜索项目名称、负责人、立项编号..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" /> 筛选
            </Button>
            <Button variant="outline" onClick={handleReset}>重置</Button>
        </div>
      </div>
    </div>
  )
}
