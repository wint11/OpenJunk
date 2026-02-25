"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Quote, Check } from "lucide-react"
import { useState } from "react"

interface CitationDialogProps {
  novel: {
    id: string
    title: string
    author: string
    createdAt: Date
    journalName?: string
  }
}

export function CitationDialog({ novel }: CitationDialogProps) {
  const [copied, setCopied] = useState(false)

  const year = novel.updatedAt.getFullYear()
  
  // APA Format
  const apa = `${novel.author}. (${year}). ${novel.title}. ${novel.journalName || "OpenJunk"}, 1(1).`
  
  // MLA Format
  const mla = `${novel.author}. "${novel.title}." ${novel.journalName || "OpenJunk"} 1.1 (${year}).`
  
  // GB/T 7714
  const gbt = `${novel.author}. ${novel.title}[J]. ${novel.journalName || "OpenJunk"}, ${year}, 1(1).`

  // BibTeX
  const bibtex = `@article{${novel.id},
  title={${novel.title}},
  author={${novel.author}},
  journal={${novel.journalName || "OpenJunk"}},
  volume={1},
  number={1},
  year={${year}}
}`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadEndNote = () => {
    // EndNote uses RIS format mostly, or its own .enw
    const content = `%0 Journal Article
%T ${novel.title}
%A ${novel.author}
%J ${novel.journalName || "OpenJunk"}
%V 1
%N 1
%D ${year}
`
    const blob = new Blob([content], { type: 'application/x-endnote-refer' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${novel.title}.enw`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Quote className="mr-2 h-4 w-4" />
          引用
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>引用此论文</DialogTitle>
          <DialogDescription>
            选择您需要的引用格式复制，或下载 EndNote 文件。
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="apa" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="apa">APA</TabsTrigger>
            <TabsTrigger value="mla">MLA</TabsTrigger>
            <TabsTrigger value="gbt">GB/T</TabsTrigger>
            <TabsTrigger value="bibtex">BibTeX</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-4">
            <TabsContent value="apa">
              <div className="relative">
                <Textarea readOnly value={apa} className="resize-none h-24 pr-10" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={() => copyToClipboard(apa)}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="mla">
              <div className="relative">
                <Textarea readOnly value={mla} className="resize-none h-24 pr-10" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={() => copyToClipboard(mla)}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="gbt">
              <div className="relative">
                <Textarea readOnly value={gbt} className="resize-none h-24 pr-10" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={() => copyToClipboard(gbt)}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="bibtex">
              <div className="relative">
                <Textarea readOnly value={bibtex} className="resize-none h-40 pr-10 font-mono text-xs" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={() => copyToClipboard(bibtex)}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        <div className="flex justify-end pt-4 border-t mt-4">
            <Button onClick={downloadEndNote}>
                下载 EndNote (.enw)
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
