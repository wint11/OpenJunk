'use client'

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"
import { useState } from "react"

interface FilterFormProps {
  departments: { id: string, name: string, code: string }[]
  categories: { id: string, name: string }[]
  years: number[]
}

export function FilterForm({ departments, categories, years }: FilterFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "all")
  const [departmentId, setDepartmentId] = useState(searchParams.get("departmentId") || "all")
  const [status, setStatus] = useState(searchParams.get("status") || "APPROVED")
  const [year, setYear] = useState(searchParams.get("year") || "all")
  const [search, setSearch] = useState(searchParams.get("search") || "")

  function handleSearch() {
    const params = new URLSearchParams()
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId)
    if (departmentId && departmentId !== "all") params.set("departmentId", departmentId)
    params.set("status", status)
    if (year && year !== "all") params.set("year", year)
    if (search) params.set("search", search)

    router.push(`?${params.toString()}`)
  }

  function handleReset() {
    setCategoryId("all")
    setDepartmentId("all")
    setStatus("APPROVED")
    setYear("all")
    setSearch("")
    router.push("?status=APPROVED")
  }

  return (
    <div className="flex flex-wrap gap-4 items-end bg-muted/20 p-4 rounded-md mb-6">
      <div className="grid gap-2">
        <Label>基金大类</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="所有大类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有大类</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>部门</Label>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="所有部门" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有部门</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.code} - {d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>年度</Label>
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

      <div className="grid gap-2">
        <Label>状态</Label>
        <Select value={status} onValueChange={(value) => setStatus(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="APPROVED">已立项</SelectItem>
            <SelectItem value="COMPLETED">已结项</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 flex-1">
        <Label>搜索</Label>
        <div className="flex gap-2">
            <Input 
                placeholder="搜索项目名称、申请人..." 
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
