"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, Trash2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

const DISCLAIMER_ACCEPTED_KEY = "openjunk_disclaimer_accepted"
const DISCLAIMER_VERSION = "1.0" // 用于后续更新免责声明时重新显示

// 白名单路径 - 这些页面不需要显示免责声明
const WHITELIST_PATHS = ["/terms", "/privacy", "/declined"]

export function DisclaimerDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsMounted(true)
    
    // 检查当前路径是否在白名单中
    const isWhitelisted = WHITELIST_PATHS.some(path => pathname?.startsWith(path))
    if (isWhitelisted) {
      return
    }
    
    // 检查用户是否已经接受免责声明
    const accepted = localStorage.getItem(DISCLAIMER_ACCEPTED_KEY)
    if (!accepted) {
      setIsOpen(true)
    }
  }, [pathname])

  const handleAccept = () => {
    if (!isChecked) return
    localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, DISCLAIMER_VERSION)
    setIsOpen(false)
  }

  const handleDecline = () => {
    // 用户拒绝则跳转到拒绝页面
    window.location.href = "/declined"
  }

  // 防止点击外部关闭 - 空函数
  const handleOpenChange = (open: boolean) => {
    // 只有当用户点击接受按钮时才允许关闭
    if (!open && !isOpen) {
      setIsOpen(false)
    }
    // 否则不做任何操作，阻止关闭
  }

  // 防止服务端渲染问题
  if (!isMounted) {
    return null
  }

  // 如果在白名单页面，不显示弹窗
  const isWhitelisted = WHITELIST_PATHS.some(path => pathname?.startsWith(path))
  if (isWhitelisted) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-2xl text-center">
            欢迎来到 OpenJunk
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            在继续使用本站之前，请仔细阅读以下重要声明
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 核心声明 */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  娱乐性质声明
                </h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                  <strong>OpenJunk 是一个纯粹的娱乐性质平台</strong>，旨在为用户提供轻松幽默的学术内容分享体验。
                  本站所有内容均为娱乐目的而创建，不代表任何正经学术观点或立场。
                </p>
              </div>
            </div>
          </div>

          {/* 免责声明列表 */}
          <div className="space-y-4 text-sm">
            <h4 className="font-semibold text-foreground">请您知悉并同意：</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>
                  本站内容<strong>不构成任何形式的学术建议、专业指导或投资意见</strong>，
                  用户应自行判断内容的真实性和适用性。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>
                  本站收录的论文、期刊等内容均为娱乐性质，不代表真实的学术评价，
                  <strong>不应作为学术研究的参考依据</strong>。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>
                  本站会尽力维护内容的准确性和服务的稳定性，但
                  <strong>不保证内容的完全正确和服务的持续可用</strong>，出现问题在所难免。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">4.</span>
                <span>
                  使用本站内容产生的任何后果由用户自行承担，
                  <strong>本站不承担任何直接或间接责任</strong>。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">5.</span>
                <span>
                  用户在本站发布的内容应遵守相关法律法规，不得侵犯他人合法权益。
                </span>
              </li>
            </ul>
          </div>

          {/* 链接 */}
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
            <p className="mb-2">
              继续使用本站即表示您已阅读并同意我们的：
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/terms"
                target="_blank"
                className="text-primary hover:underline font-medium"
              >
                《用户协议》
              </Link>
              <span>和</span>
              <Link
                href="/privacy"
                target="_blank"
                className="text-primary hover:underline font-medium"
              >
                《隐私政策》
              </Link>
            </div>
          </div>

          {/* 确认勾选 */}
          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="disclaimer-accept"
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked as boolean)}
              className="mt-1"
            />
            <label
              htmlFor="disclaimer-accept"
              className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
            >
              我已阅读并理解上述声明，知晓 OpenJunk 是娱乐性质的平台，
              自愿承担使用本站可能产生的风险。
            </label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="w-full sm:w-auto"
          >
            <X className="mr-2 h-4 w-4" />
            离开本站
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!isChecked}
            className="w-full sm:w-auto"
          >
            我已了解，进入网站
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
