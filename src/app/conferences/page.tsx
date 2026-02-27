import { Metadata } from "next"

export const metadata: Metadata = {
  title: "会议矩阵 - OpenJunk",
  description: "全球顶级水会一网打尽",
}

export default function ConferencesPage() {
  return (
    <div className="container mx-auto py-12 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">会议矩阵</h1>
      <p className="text-muted-foreground">正在建设中，敬请期待...</p>
    </div>
  )
}
