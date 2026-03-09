"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { handleSearch, getTrendingPlaceholders } from "@/app/actions/search"
import { searchPlaceholders as defaultPlaceholders } from "@/config/search-placeholder"

export function SearchBar() {
  const searchParams = useSearchParams()
  const [query, setQuery] = React.useState("")
  const [placeholders, setPlaceholders] = React.useState<string[]>(defaultPlaceholders)
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = React.useState(0)
  const [isPending, startTransition] = React.useTransition()

  // Sync with URL query param
  React.useEffect(() => {
    setQuery(searchParams.get("q") || "")
  }, [searchParams])

  // Fetch trending topics on mount
  React.useEffect(() => {
    getTrendingPlaceholders().then((trending) => {
      if (trending && trending.length > 0) {
        // Merge trending with default, remove duplicates
        const merged = Array.from(new Set([...trending, ...defaultPlaceholders]));
        setPlaceholders(merged);
      }
    }).catch(console.error);
  }, []);

  // Rotate placeholders
  React.useEffect(() => {
    if (placeholders.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 5000); // 5 seconds rotation

    return () => clearInterval(interval);
  }, [placeholders]);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // Use transition to show pending state if needed, though redirect happens fast
    startTransition(async () => {
        await handleSearch(query);
    });
  }

  return (
    <form onSubmit={onSearch} className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholders[currentPlaceholderIndex]}
        className="w-full bg-background pl-9 transition-all duration-300 ease-in-out
          w-[120px] sm:w-[150px] md:w-[180px] lg:w-[250px] xl:w-[300px]"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isPending}
      />
    </form>
  )
}
