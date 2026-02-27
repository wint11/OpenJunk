import { Metadata } from "next"

export const metadata: Metadata = {
  title: "奖项 - OpenJunk",
}

export default function AwardsPage() {
  return (
    <div className="container mx-auto py-12 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">奖项</h1>
      <p className="text-muted-foreground">正在建设中，敬请期待...</p>
    </div>
  )
}
