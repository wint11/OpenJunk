'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, X, Check, ArrowRight, Upload } from "lucide-react"
import { publishNovel, rejectNovel } from "./actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"

interface NovelAuditActionsProps {
  novel: {
    id: string
    title: string
    author: string
    description: string
    pdfUrl: string | null
    fundApplications: { id: string }[]
  }
  fundApplications: { id: string, title: string, serialNo: string | null }[]
  availableJournals: { id: string, name: string }[]
}

export function NovelAuditActions({ novel, fundApplications, availableJournals }: NovelAuditActionsProps) {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  
  // Form State
  const [selectedJournalId, setSelectedJournalId] = useState<string>(
    availableJournals.length === 1 ? availableJournals[0].id : ''
  )
  const [title, setTitle] = useState(novel.title)
  const [author, setAuthor] = useState(novel.author)
  const [description, setDescription] = useState(novel.description)
  const [selectedFunds, setSelectedFunds] = useState<string[]>(
    novel.fundApplications.map(f => f.id)
  )

  const toggleFund = (fundId: string) => {
    setSelectedFunds(prev => 
      prev.includes(fundId) 
        ? prev.filter(id => id !== fundId)
        : [...prev, fundId]
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* ... (Download & Reject buttons remain same) ... */}
      {/* Download Button */}
      <Button variant="outline" size="sm" asChild>
        <a 
          href={novel.pdfUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          download 
          className={!novel.pdfUrl ? "pointer-events-none opacity-50" : ""}
          title="下载稿件"
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">下载</span>
        </a>
      </Button>

      {/* Reject Form */}
      <form action={rejectNovel}>
        <input type="hidden" name="novelId" value={novel.id} />
        <input type="hidden" name="feedback" value="快速拒稿" />
        <Button 
          variant="destructive" 
          size="sm" 
          type="submit"
          title="拒稿"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">拒稿</span>
        </Button>
      </form>

      {/* Publish Dialog Trigger */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            录用...
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>录用并发布稿件</DialogTitle>
            <DialogDescription>
              请确认文章信息，选择发布期刊，并可上传最终版 PDF。
            </DialogDescription>
          </DialogHeader>
          
          <form action={publishNovel} onSubmit={() => setPublishDialogOpen(false)} className="space-y-6 py-4">
             <input type="hidden" name="novelId" value={novel.id} />
             <input type="hidden" name="feedback" value="录用发布" />
             
             {/* Journal Selection (Single-select) */}
             <div className="grid gap-2">
                <Label htmlFor="journal">发布目标期刊 <span className="text-red-500">*</span></Label>
                <Select 
                    name="targetJournalId"
                    value={selectedJournalId} 
                    onValueChange={setSelectedJournalId}
                    disabled={availableJournals.length === 1} 
                >
                    <SelectTrigger>
                        <SelectValue placeholder="请选择期刊" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableJournals.map((journal) => (
                            <SelectItem key={journal.id} value={journal.id}>
                                {journal.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {availableJournals.length > 1 && (
                    <p className="text-xs text-muted-foreground">您拥有多个期刊权限，请选择其中一个进行发布。</p>
                )}
             </div>

             {/* Metadata Editing */}
             <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">元数据编辑</h4>
                
                <div className="grid gap-2">
                    <Label htmlFor="title">文章标题</Label>
                    <Input id="title" name="title" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="author">作者</Label>
                    <Input id="author" name="author" value={author} onChange={e => setAuthor(e.target.value)} required />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">摘要</Label>
                    <Textarea id="description" name="description" value={description} onChange={e => setDescription(e.target.value)} className="min-h-[80px]" required />
                </div>

                 <div className="grid gap-2">
                    <Label>关联基金项目</Label>
                    <ScrollArea className="h-[120px] w-full rounded-md border p-2">
                        {fundApplications.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">无可用基金项目</div>
                        ) : (
                            <div className="space-y-2">
                                {fundApplications.map((fund) => (
                                    <div key={fund.id} className="flex items-start space-x-2">
                                        <Checkbox 
                                            id={`fund-${fund.id}`} 
                                            name="fundApplicationIds" 
                                            value={fund.id}
                                            checked={selectedFunds.includes(fund.id)}
                                            onCheckedChange={() => toggleFund(fund.id)}
                                        />
                                        <label
                                            htmlFor={`fund-${fund.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            <span className="block text-xs text-muted-foreground">{fund.serialNo}</span>
                                            {fund.title}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
             </div>

             {/* PDF Upload (Mandatory) */}
             <div className="grid gap-2">
                <Label htmlFor="pdfFile">上传最终版 PDF <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-2">
                    <Input id="pdfFile" name="pdfFile" type="file" accept=".pdf" className="cursor-pointer" required />
                </div>
                <p className="text-xs text-muted-foreground">必须上传经过排版的最终 PDF 文件。</p>
             </div>

             <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPublishDialogOpen(false)}>取消</Button>
                <Button type="submit" disabled={!selectedJournalId} className="bg-green-600 hover:bg-green-700">
                    <Check className="mr-2 h-4 w-4" /> 确认发布
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
