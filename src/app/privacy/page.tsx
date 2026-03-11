import { Metadata } from "next"
import { Shield, Lock, Eye, Database, Cookie, UserX } from "lucide-react"

export const metadata: Metadata = {
  title: "隐私政策 - OpenJunk",
  description: "OpenJunk 隐私政策 - 了解我们如何保护您的个人信息。",
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-muted/30 py-16 border-b">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            隐私政策
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            我们重视您的隐私，了解我们如何收集、使用和保护您的信息
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg dark:prose-invert mx-auto space-y-8">

            {/* 简介 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">隐私保护承诺</h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    OpenJunk 致力于保护用户的个人隐私。我们仅收集提供服务所必需的信息，
                    并采取合理措施保护您的数据安全。我们绝不会出售您的个人信息给第三方。
                  </p>
                </div>
              </div>
            </div>

            {/* 第一条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Database className="h-6 w-6 text-primary" />
                1. 信息收集
              </h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  1.1 <strong>您主动提供的信息：</strong>当您注册账号、发布内容、
                  参与互动或使用其他服务时，我们可能会收集您提供的以下信息：
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>账号信息（用户名、邮箱地址等）</li>
                  <li>个人资料（头像、简介等）</li>
                  <li>发布的内容（论文、评论等）</li>
                  <li>与我们的通信记录</li>
                </ul>
                <p>
                  1.2 <strong>自动收集的信息：</strong>当您使用本站服务时，
                  我们可能会自动收集以下信息：
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>设备信息（浏览器类型、操作系统等）</li>
                  <li>日志信息（IP地址、访问时间、浏览记录等）</li>
                  <li>Cookie和类似技术收集的信息</li>
                  <li>使用数据（点击、滚动、停留时间等）</li>
                </ul>
              </div>
            </div>

            {/* 第二条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Eye className="h-6 w-6 text-primary" />
                2. 信息使用
              </h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  2.1 我们使用收集的信息用于以下目的：
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>提供、维护和改进我们的服务</li>
                  <li>处理您的注册和账号管理</li>
                  <li>展示您发布的内容</li>
                  <li>向您发送服务通知和更新</li>
                  <li>防止欺诈和滥用行为</li>
                  <li>分析使用趋势以优化用户体验</li>
                  <li>遵守法律法规要求</li>
                </ul>
                <p>
                  2.2 我们不会将您的个人信息用于与上述目的无关的用途，
                  除非事先获得您的明确同意或法律法规另有规定。
                </p>
              </div>
            </div>

            {/* 第三条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">3. 信息共享</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  3.1 我们不会出售、出租或以其他方式向第三方披露您的个人信息，
                  但以下情况除外：
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>
                    <strong>您的公开信息：</strong>您选择公开的个人资料信息和发布的内容
                    将对其他用户可见。
                  </li>
                  <li>
                    <strong>服务提供商：</strong>我们可能与可信赖的第三方服务提供商合作，
                    他们协助我们运营网站和提供服务，并受保密义务约束。
                  </li>
                  <li>
                    <strong>法律要求：</strong>当法律法规要求或政府机关依法要求时，
                    我们可能会披露您的信息。
                  </li>
                  <li>
                    <strong>保护权益：</strong>为保护本站、用户或公众的权利、财产或安全，
                    我们可能在必要时披露信息。
                  </li>
                </ul>
              </div>
            </div>

            {/* 第四条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Cookie className="h-6 w-6 text-primary" />
                4. Cookie 和类似技术
              </h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  4.1 我们使用 Cookie 和类似技术来：
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>记住您的登录状态和偏好设置</li>
                  <li>分析网站流量和使用模式</li>
                  <li>提供个性化的用户体验</li>
                  <li>防止欺诈和提高安全性</li>
                </ul>
                <p>
                  4.2 您可以通过浏览器设置管理或删除 Cookie。但请注意，
                  禁用 Cookie 可能会影响某些功能的正常使用。
                </p>
                <p>
                  4.3 我们使用的 Cookie 类型包括：
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li><strong>必要 Cookie：</strong>确保网站基本功能运行所必需</li>
                  <li><strong>偏好 Cookie：</strong>记住您的设置和偏好</li>
                  <li><strong>统计 Cookie：</strong>帮助我们了解用户如何与网站互动</li>
                </ul>
              </div>
            </div>

            {/* 第五条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">5. 数据安全</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  5.1 我们采取合理的安全措施保护您的个人信息：
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>使用加密技术保护数据传输</li>
                  <li>实施访问控制限制数据访问</li>
                  <li>定期审查和更新安全措施</li>
                </ul>
                <p>
                  5.2 尽管我们努力保护您的数据，但互联网传输无法保证绝对安全。
                  我们无法承诺您的信息绝对安全，请您理解并自行承担风险。
                </p>
              </div>
            </div>

            {/* 第六条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">6. 数据保留</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  6.1 我们仅在实现本隐私政策所述目的所必需的期限内保留您的个人信息，
                  除非法律要求或允许延长保留期限。
                </p>
                <p>
                  6.2 当您的账号被删除或您要求我们删除信息时，
                  我们将在合理期限内删除或匿名化您的个人信息，
                  但法律法规要求保留的信息除外。
                </p>
              </div>
            </div>

            {/* 第七条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <UserX className="h-6 w-6 text-primary" />
                7. 您的权利
              </h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  7.1 根据适用的法律法规，您可能拥有以下权利：
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li><strong>访问权：</strong>获取我们持有的关于您的个人信息</li>
                  <li><strong>更正权：</strong>要求更正不准确或不完整的个人信息</li>
                  <li><strong>删除权：</strong>要求删除您的个人信息（在特定条件下）</li>
                  <li><strong>限制处理权：</strong>要求限制对您个人信息的处理</li>
                  <li><strong>数据可携带权：</strong>获取您的数据副本并传输给其他服务</li>
                  <li><strong>反对权：</strong>反对某些类型的数据处理</li>
                </ul>
                <p>
                  7.2 如需行使上述权利，请通过本政策末尾提供的联系方式与我们联系。
                  我们将在合理期限内响应您的请求。
                </p>
              </div>
            </div>

            {/* 第八条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">8. 未成年人保护</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  8.1 本站服务不面向未满18周岁的未成年人。我们不会故意收集未成年人的个人信息。
                </p>
                <p>
                  8.2 如果您发现未成年人向我们提供了个人信息，请立即联系我们，
                  我们将采取措施删除相关信息。
                </p>
              </div>
            </div>

            {/* 第九条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">9. 政策更新</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  9.1 我们可能会不时更新本隐私政策。更新后的政策将在本站公示，
                  重大变更时我们会通过适当方式通知您。
                </p>
                <p>
                  9.2 建议您定期查看本政策以了解最新内容。继续使用我们的服务
                  即表示您接受更新后的隐私政策。
                </p>
              </div>
            </div>

            {/* 第十条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">10. 联系我们</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  如果您对本隐私政策有任何疑问、意见或请求，请通过以下方式联系我们：
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>邮箱：privacy@openjunk.org</li>
                  <li>GitHub Issues</li>
                </ul>
                <p>
                  我们将在收到您的反馈后尽快回复。
                </p>
              </div>
            </div>

            {/* 生效日期 */}
            <div className="border-t pt-8 mt-12 text-center text-sm text-muted-foreground">
              <p>本隐私政策最后更新日期：2026年3月11日</p>
              <p>本政策自发布之日起生效</p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
