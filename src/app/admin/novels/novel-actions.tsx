'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star, StarOff, AlertTriangle, CheckCircle, Trash2, MoreHorizontal, ImageIcon, Loader2, X } from "lucide-react"
import { toggleRecommended, toggleNovelStatus, deleteNovel, uploadNovelCover } from "./actions"

interface NovelActionsProps {
  id: string
  status: string
  isRecommended: boolean
  coverUrl?: string | null
  title: string
}

export function NovelActions({ id, status, isRecommended, coverUrl, title }: NovelActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [isCoverDialogOpen, setIsCoverDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(coverUrl || null)

  const handleRecommended = async () => {
    setLoading("recommended")
    try {
        await toggleRecommended(id, isRecommended)
    } catch {
        alert("操作失败")
    } finally {
        setLoading(null)
    }
  }

  const handleStatus = async () => {
    const action = status === 'PUBLISHED' ? '撤稿' : '恢复'
    if (!confirm(`确定要${action}这篇稿件吗？`)) return
    
    setLoading("status")
    try {
        await toggleNovelStatus(id, status)
    } catch {
        alert("操作失败")
    } finally {
        setLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm("确定要彻底删除这篇稿件吗？此操作不可恢复！")) return

    setLoading("delete")
    try {
        await deleteNovel(id)
    } catch (error) {
        alert("操作失败: " + (error as Error).message)
    } finally {
        setLoading(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUploadCover = async () => {
    if (!selectedFile) return
    
    setLoading("uploadCover")
    try {
      const formData = new FormData()
      formData.append('cover', selectedFile)
      
      const result = await uploadNovelCover(id, formData)
      if (result.success) {
        setCurrentCoverUrl(result.coverUrl || null)
        setIsCoverDialogOpen(false)
        setSelectedFile(null)
        setPreviewUrl(null)
        alert("封面上传成功")
      } else {
        alert(result.message || "上传失败")
      }
    } catch (error) {
      alert("上传失败: " + (error as Error).message)
    } finally {
      setLoading(null)
    }
  }

  const handleCloseDialog = () => {
    setIsCoverDialogOpen(false)
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRecommended} disabled={!!loading}>
            {isRecommended ? (
              <><StarOff className="w-4 h-4 mr-2" /> 取消精选</>
            ) : (
              <><Star className="w-4 h-4 mr-2" /> 设为精选</>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleStatus} disabled={!!loading}>
            {status === 'PUBLISHED' ? (
              <><AlertTriangle className="w-4 h-4 mr-2" /> 撤稿</>
            ) : (
              <><CheckCircle className="w-4 h-4 mr-2" /> 恢复</>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setIsCoverDialogOpen(true)} disabled={!!loading}>
            <ImageIcon className="w-4 h-4 mr-2" /> 上传封面
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleDelete} 
            disabled={!!loading}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" /> 删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCoverDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>上传论文封面 - {title}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6 mt-4">
            {/* 左侧：当前封面 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">当前封面</h4>
              <div className="aspect-[3/4] rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                {currentCoverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentCoverUrl}
                    alt="当前封面"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">暂无封面</p>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：上传新封面 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">上传新封面</h4>
              <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 flex flex-col items-center justify-center overflow-hidden relative hover:border-muted-foreground/50 transition-colors">
                {previewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="预览"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl)
                          setPreviewUrl(null)
                        }
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground text-center">点击上传封面图</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">支持 JPG、PNG 格式</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleCloseDialog}>
              取消
            </Button>
            <Button 
              onClick={handleUploadCover} 
              disabled={!selectedFile || loading === "uploadCover"}
            >
              {loading === "uploadCover" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确认上传
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
