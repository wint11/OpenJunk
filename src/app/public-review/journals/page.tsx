
import { checkIpMatches } from "./actions"
import { SearchPanel } from "./search-panel"

export default async function JournalReviewPage() {
  // Check if current user IP matches any pending drafts
  const { matches } = await checkIpMatches()

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">期刊评审</h1>
          <p className="text-muted-foreground mt-2">
            搜索并评审待审阅的期刊论文。输入完整标题以查找。
          </p>
        </div>
      </div>

      <SearchPanel initialIpMatches={matches} />
    </div>
  )
}
