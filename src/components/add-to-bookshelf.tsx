"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { incrementPopularity } from "@/lib/popularity"

interface AddToBookshelfProps {
  novel: {
    id: string
    title: string
    author: string
    coverUrl: string | null
  }
}

export function AddToBookshelf({ novel }: AddToBookshelfProps) {
  const [isInShelf, setIsInShelf] = React.useState(false)

  React.useEffect(() => {
    const shelf = JSON.parse(localStorage.getItem("bookshelf") || "[]")
    setIsInShelf(shelf.includes(novel.id))
  }, [novel.id])

  const toggleShelf = () => {
    const shelf = JSON.parse(localStorage.getItem("bookshelf") || "[]") as string[]
    let newShelf
    if (shelf.includes(novel.id)) {
      newShelf = shelf.filter(id => id !== novel.id)
      setIsInShelf(false)
    } else {
      newShelf = [...shelf, novel.id]
      setIsInShelf(true)
      // Increment popularity
      // This is a server action called from client component
      incrementPopularity(novel.id, 'BOOKSHELF')
    }
    localStorage.setItem("bookshelf", JSON.stringify(newShelf))
  }

  return (
    <Button 
      size="lg" 
      variant={isInShelf ? "secondary" : "outline"} 
      className="h-11"
      onClick={toggleShelf}
    >
      {isInShelf ? (
        <>
          <BookmarkCheck className="h-4 w-4 mr-2" />
          已捡回
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4 mr-2" />
          捡回垃圾
        </>
      )}
    </Button>
  )
}
