import { Metadata } from "next"

export const metadata: Metadata = {
  title: "作者 - OpenJunk",
}

export default function AuthorsPage() {
  return (
    <div className="container mx-auto py-12 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">作者</h1>
      <p className="text-muted-foreground">正在建设中，敬请期待...</p>
    </div>
  )
}
