import { Metadata } from "next"
import { Trash2, Recycle, Wind, AlertTriangle, Users, Mail, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "关于我们 - OpenJunk",
  description: "了解 OpenJunk 的使命与愿景，打造全球最真实的学术垃圾场。",
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-muted/30 py-20 border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800/50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Trash2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            关于 <span className="text-primary">OpenJunk</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            致力于收录全球各类“底刊”与“学术垃圾”，为那些无处安放的思想提供最后的归宿。
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4 p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold">诚实面对垃圾</h3>
              <p className="text-muted-foreground">
                我们不粉饰太平。如果是垃圾，我们就称之为垃圾。在这里，您可以坦然面对学术生涯中的废品。
              </p>
            </div>
            
            <div className="space-y-4 p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Recycle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold">变废为宝（并没有）</h3>
              <p className="text-muted-foreground">
                虽然我们叫 OpenJunk，但也许（极小概率）有人能在垃圾堆里翻到金子。哪怕只是反面教材。
              </p>
            </div>

            <div className="space-y-4 p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Wind className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">自由呼吸</h3>
              <p className="text-muted-foreground">
                没有同行评审的压力（反正都是垃圾），没有拒稿的烦恼。在这里，您可以自由地呼吸学术废气的芬芳。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center mb-12">我们的故事</h2>
            
            <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground">
              <p>
                OpenJunk 成立于 2026 年的一个深夜，当时我们的创始人面对着第 108 次被拒稿的邮件，陷入了深深的沉思。
                为什么学术界如此严苛？为什么那些仅仅因为“缺乏创新性”、“实验数据不足”或“逻辑混乱”的论文就必须被埋没？
              </p>
              <p>
                于是，一个大胆的想法诞生了：建立一个专门收录“被遗弃论文”的平台。我们不追求影响因子，我们追求“垃圾因子”。
                在这里，每一篇论文都是平等的——平等的烂。
              </p>
              <p>
                今天，OpenJunk 已经成为全球最大的学术垃圾集散地之一。我们的口号是：“如果别的期刊不要，给我们！”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5 border-t">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl font-bold">准备好加入这场垃圾盛宴了吗？</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            不要害羞，把你压箱底的存货都拿出来吧。在这里，没有人会嘲笑你，因为大家都一样烂。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-12 px-8 text-lg" asChild>
              <Link href="/journals/submission">
                <Trash2 className="mr-2 h-5 w-5" />
                扔垃圾（投稿）
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
              <Link href="/journals/browse">
                <Users className="mr-2 h-5 w-5" />
                去翻垃圾堆
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
