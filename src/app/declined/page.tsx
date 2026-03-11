import { Metadata } from "next"
import { XCircle, ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "访问被拒绝 - OpenJunk",
  description: "您需要同意免责声明才能访问 OpenJunk",
}

export default function DeclinedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full bg-card shadow-lg rounded-xl border p-10 space-y-8 text-center">

        {/* 图标区域 */}
        <div className="flex justify-center">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full">
            <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* 标题与正文 */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            访问被拒绝
          </h1>

          <div className="w-16 h-1 bg-red-500 mx-auto rounded-full"></div>

          <p className="text-muted-foreground leading-relaxed">
            您不同意 OpenJunk 的免责声明，无法访问本站内容。
          </p>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-left">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>提示：</strong>如果您希望访问 OpenJunk，请点击下方按钮返回首页，
              并在弹出的免责声明中选择"我已了解，进入网站"。
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              重新访问网站
            </Link>
          </Button>
        </div>

        {/* 底部说明 */}
        <div className="pt-6 border-t text-xs text-muted-foreground">
          <p>
            您随时可以返回首页重新查看免责声明并选择同意。
          </p>
        </div>
      </div>
    </div>
  )
}
