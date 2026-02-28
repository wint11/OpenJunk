'use client'

import { useState } from "react"
import { useActionState, useEffect } from "react"
import { updateFundCategoryIntro } from "./actions"
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

type ActionState = {
  success?: boolean
  message?: string
} | null

interface EditIntroDialogProps {
  category: {
    id: string
    name: string
    code: string
    introContent: string | null
    introImages: string | null
  }
}

export function EditIntroDialog({ category }: EditIntroDialogProps) {
  const [open, setOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(category.introImages)
  
  // Bind ID to action
  const updateWithId = updateFundCategoryIntro.bind(null, category.id)
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateWithId, null)

  const [lastHandledState, setLastHandledState] = useState<ActionState>(null)

  useEffect(() => {
    // Only process if state has changed and hasn't been handled yet
    if (state && state !== lastHandledState) {
      if (state.success) {
        if (open) {
          setOpen(false)
          toast.success(state.message || "更新成功")
        }
      } else if (state.message) {
        toast.error(state.message)
      }
      setLastHandledState(state)
    }
  }, [state, open, lastHandledState])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" /> 编辑介绍
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑组织介绍 - {category.name}</DialogTitle>
          <DialogDescription>
            编辑基金大类的详细介绍和展示图片。
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="introContent">组织介绍</Label>
            <Textarea 
              id="introContent" 
              name="introContent" 
              defaultValue={category.introContent || ""} 
              placeholder="请输入详细的组织介绍..." 
              className="min-h-[200px]"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="introImage">组织图片/封面</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                {previewUrl ? (
                  <Image 
                    src={previewUrl} 
                    alt="Preview" 
                    fill 
                    className="object-cover" 
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Input 
                  id="introImage" 
                  name="introImage" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  支持 JPG, PNG 格式，建议尺寸 800x600。
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存修改"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
