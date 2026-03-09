"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Layers, BookOpen, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type ViewMode = "pdf" | "cover"

export function PreferenceForm() {
  const [currentMode, setCurrentMode] = useState<ViewMode>("pdf")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedMode = localStorage.getItem("openjunk-view-mode") as ViewMode | null
    if (savedMode && (savedMode === "pdf" || savedMode === "cover")) {
      setCurrentMode(savedMode)
    }
  }, [])

  const handleModeChange = (value: ViewMode) => {
    setCurrentMode(value)
    localStorage.setItem("openjunk-view-mode", value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>首页展示风格</CardTitle>
          <CardDescription>
            选择您喜欢的首页论文展示方式
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentMode}
            onValueChange={(value) => handleModeChange(value as ViewMode)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* PDF 预览模式 */}
            <div className="relative">
              <RadioGroupItem
                value="pdf"
                id="pdf"
                className="peer sr-only"
              />
              <Label
                htmlFor="pdf"
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full",
                  currentMode === "pdf" && "border-primary bg-primary/5"
                )}
              >
                <div className="mb-3 p-3 rounded-full bg-primary/10">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-semibold mb-1">3D 卡片轮播</div>
                  <div className="text-xs text-muted-foreground">
                    PDF 预览 + 卡片堆叠效果
                  </div>
                </div>
                {currentMode === "pdf" && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}
              </Label>
            </div>

            {/* 封面翻页模式 */}
            <div className="relative">
              <RadioGroupItem
                value="cover"
                id="cover"
                className="peer sr-only"
              />
              <Label
                htmlFor="cover"
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full",
                  currentMode === "cover" && "border-primary bg-primary/5"
                )}
              >
                <div className="mb-3 p-3 rounded-full bg-amber-500/10">
                  <BookOpen className="h-8 w-8 text-amber-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold mb-1">杂志翻页</div>
                  <div className="text-xs text-muted-foreground">
                    书本翻页效果 + 封面图展示
                  </div>
                </div>
                {currentMode === "cover" && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}
              </Label>
            </div>
          </RadioGroup>

          {saved && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm flex items-center gap-2">
              <Check className="h-4 w-4" />
              偏好已保存，刷新首页即可看到效果
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>预览说明</CardTitle>
          <CardDescription>
            两种展示风格的特点对比
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                3D 卡片轮播
              </h4>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>• 保留垃圾桶开场动画</li>
                <li>• 3D Coverflow 风格的卡片切换</li>
                <li>• 直接显示 PDF 第一页预览</li>
                <li>• 显示论文标题和作者信息</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                杂志翻页
              </h4>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>• 保留垃圾桶开场动画</li>
                <li>• 仿真书本翻页效果</li>
                <li>• 只显示论文封面图</li>
                <li>• 左右显示相邻封面预览</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            提示：杂志翻页模式需要论文有封面图才能显示最佳效果。如果没有封面图，会显示默认占位符。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
