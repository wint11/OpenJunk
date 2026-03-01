'use client'

import { useState, useActionState, useEffect } from "react"
import { updateFundCategory, updateFundCategoryIntro } from "./actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Loader2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
} | null

interface EditFundDialogProps {
  category: {
    id: string
    name: string
    code: string
    description: string | null
    introContent: string | null
    introImages: string | null
  }
  isSuperAdmin: boolean
}

export function EditFundDialog({ category, isSuperAdmin }: EditFundDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? "basic" : "intro")

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="编辑">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] flex flex-col h-[80vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>编辑基金组织 - {category.name}</DialogTitle>
          <DialogDescription>
            {isSuperAdmin 
              ? "您可以修改基金的基本信息以及组织介绍内容。" 
              : "您可以修改该基金组织的介绍和展示图片。"}
          </DialogDescription>
        </DialogHeader>

        {isSuperAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="intro">组织介绍</TabsTrigger>
            </TabsList>
            <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1">
              <TabsContent value="basic" className="mt-0 h-full">
                <BasicInfoForm category={category} onSuccess={() => setOpen(false)} />
              </TabsContent>
              <TabsContent value="intro" className="mt-0 h-full">
                <IntroForm category={category} onSuccess={() => setOpen(false)} />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="py-4 flex-1 min-h-0 overflow-y-auto pr-1">
            <IntroForm category={category} onSuccess={() => setOpen(false)} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function BasicInfoForm({ category, onSuccess }: { category: any, onSuccess: () => void }) {
  const updateWithId = updateFundCategory.bind(null, category.id)
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateWithId, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || "更新成功")
      onSuccess()
    } else if (state?.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, onSuccess])

  return (
    <form action={formAction} className="grid gap-6 h-full content-between py-2">
      <div className="space-y-6">
        <div className="grid gap-3">
          <Label htmlFor="name" className="text-base font-medium">基金名称</Label>
          <Input 
            id="name" 
            name="name" 
            defaultValue={category.name} 
            placeholder="例如：国家自然科学基金" 
            required 
            className="h-10"
          />
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="code" className="text-base font-medium">唯一代码</Label>
          <Input 
            id="code" 
            name="code" 
            defaultValue={category.code} 
            placeholder="例如：NSFC" 
            required 
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">
            仅限大写字母和数字，用于系统内部标识
          </p>
        </div>

        <div className="grid gap-3">
          <Label htmlFor="description" className="text-base font-medium">描述信息</Label>
          <Textarea 
            id="description" 
            name="description" 
            defaultValue={category.description || ""} 
            placeholder="请输入基金的简要描述..." 
            className="min-h-[100px] resize-none" 
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t mt-auto">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "保存基本信息"}
        </Button>
      </div>
    </form>
  )
}

function IntroForm({ category, onSuccess }: { category: any, onSuccess: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(category.introImages)
  const updateWithId = updateFundCategoryIntro.bind(null, category.id)
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateWithId, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || "更新成功")
      onSuccess()
    } else if (state?.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, onSuccess])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  return (
    <form action={formAction} className="grid gap-6 h-full content-between py-2">
      <div className="space-y-6">
        <div className="grid gap-3">
          <Label htmlFor="introContent" className="text-base font-medium">组织详细介绍</Label>
          <Textarea 
            id="introContent" 
            name="introContent" 
            defaultValue={category.introContent || ""} 
            placeholder="请输入详细的组织介绍内容..." 
            className="min-h-[100px] resize-none"
          />
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="introImage" className="text-base font-medium">组织封面图片</Label>
          <div className="flex items-start gap-6 border rounded-lg p-4 bg-muted/20">
            <div className="relative w-40 h-28 border-2 border-dashed rounded-lg overflow-hidden bg-background flex items-center justify-center group">
              {previewUrl ? (
                <>
                  <Image 
                    src={previewUrl} 
                    alt="Preview" 
                    fill 
                    className="object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs">暂无图片</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="introImage" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 w-full">
                  选择图片...
                </Label>
                <Input 
                  id="introImage" 
                  name="introImage" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                建议上传 16:9 比例的高清图片（如 800x450），支持 JPG/PNG 格式，最大 5MB。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t mt-auto">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "保存介绍信息"}
        </Button>
      </div>
    </form>
  )
}
