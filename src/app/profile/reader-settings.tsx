"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const THEME_OPTIONS = [
  { value: "light", label: "白昼" },
  { value: "sepia", label: "护眼" },
  { value: "dark", label: "夜间" },
]

const FONT_SIZES = [14, 16, 18, 20, 22, 24, 26, 28, 30, 32]

function clampFontSize(value: number) {
  return Math.min(Math.max(value, 14), 32)
}

export function ReaderSettingsCard() {
  const [mounted, setMounted] = React.useState(false)
  const [fontSize, setFontSize] = React.useState(18)
  const [theme, setTheme] = React.useState("light")

  React.useEffect(() => {
    setMounted(true)
    const savedSize = localStorage.getItem("reader-font-size")
    const savedTheme = localStorage.getItem("reader-theme")

    if (savedSize) {
      const n = parseInt(savedSize)
      if (!Number.isNaN(n)) setFontSize(clampFontSize(n))
    }
    if (savedTheme) setTheme(savedTheme)
  }, [])

  const updateFontSize = (next: number) => {
    const v = clampFontSize(next)
    setFontSize(v)
    localStorage.setItem("reader-font-size", v.toString())
  }

  const updateTheme = (next: string) => {
    setTheme(next)
    localStorage.setItem("reader-theme", next)
  }

  if (!mounted) return null

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>阅读设置</CardTitle>
        <CardDescription>这里的设置会同步到阅读页</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 flex-1 overflow-y-auto">
        <div className="grid gap-2">
          <Label>背景主题</Label>
          <Select value={theme} onValueChange={updateTheme}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择主题" />
            </SelectTrigger>
            <SelectContent>
              {THEME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>字号大小</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => updateFontSize(fontSize - 2)}
              disabled={fontSize <= 14}
            >
              -
            </Button>
            <div className="min-w-16 text-center text-sm font-medium">{fontSize}px</div>
            <Button
              variant="outline"
              onClick={() => updateFontSize(fontSize + 2)}
              disabled={fontSize >= 32}
            >
              +
            </Button>
            <div className="ml-auto w-44">
              <Select value={fontSize.toString()} onValueChange={(v) => updateFontSize(parseInt(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择字号" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      {s}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

