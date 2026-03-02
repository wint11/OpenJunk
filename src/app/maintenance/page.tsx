
import { Metadata } from "next"
import { Shield, Clock, Info } from "lucide-react"

export const metadata: Metadata = {
  title: "系统维护公告",
  description: "系统正在进行维护升级",
}

export default function MaintenancePage() {
  return (
    // 使用 fixed 定位覆盖全屏，z-index 确保在最上层
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
      <div className="max-w-lg w-full bg-white dark:bg-zinc-900 shadow-2xl rounded-xl border border-zinc-200 dark:border-zinc-800 p-10 space-y-8">
        
        {/* 图标区域：稳重、静态 */}
        <div className="flex justify-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full">
            <Shield className="h-16 w-16 text-blue-700 dark:text-blue-500" />
          </div>
        </div>

        {/* 标题与正文：正式、严肃 */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            系统维护公告
          </h1>
          
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>

          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-base">
            尊敬的用户：
            <br />
            为了更加优质的服务体验，系统正在进行维护。
            <br />
            在此期间，所有服务将暂时不可用。
            <br />给您带来的不便，我们深表歉意，敬请谅解。
          </p>
        </div>

        {/* 时间信息：清晰明了 */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-lg p-5">
          <div className="flex items-start gap-4">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-left space-y-1">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">维护时间段</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                2026年3月3日 18:00 — 2026年3月6日 00:00
              </p>
            </div>
          </div>
        </div>

        {/* 底部版权：弱化显示 */}
        <div className="text-xs text-zinc-400 dark:text-zinc-600 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          OpenJunk 技术团队 &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
