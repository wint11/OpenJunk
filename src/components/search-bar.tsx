"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = React.useState("")

  // Sync with URL query param
  React.useEffect(() => {
    setQuery(searchParams.get("q") || "")
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="搜索论文标题或作者..."
        className="w-full bg-background pl-9 md:w-[200px] lg:w-[300px]"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  )
}
