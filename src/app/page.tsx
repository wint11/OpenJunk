import { getRecommendedPapers } from "@/lib/recommendation"
import { DeckSwitcher } from "@/components/home/deck-switcher"

export const dynamic = 'force-dynamic'

export default async function Home() {
  const featuredPapers = await getRecommendedPapers(12)

  return (
    <div className="flex flex-col flex-1 h-full bg-background overflow-hidden relative">
      {/* 
        两种展示风格：
        1. SplashTrashDeck - 3D卡片轮播，显示PDF预览（默认）
        2. MagazineFlipDeck - 翻页式杂志，显示封面图
        
        用户可以在个人中心切换风格，偏好保存在 localStorage
      */}
      <DeckSwitcher papers={featuredPapers} />
    </div>
  )
}
