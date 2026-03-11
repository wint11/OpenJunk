import { Metadata } from "next"
import { FileText, AlertTriangle, Scale, Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "用户协议",
  description: "OpenJunk 用户协议 - 使用我们服务前请仔细阅读。",
}

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-muted/30 py-16 border-b">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            用户协议
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            使用 OpenJunk 服务前，请仔细阅读以下条款
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg dark:prose-invert mx-auto space-y-8">
            
            {/* 重要提示 */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">重要提示</h3>
                  <p className="text-amber-700 dark:text-amber-300 text-sm">
                    OpenJunk 是一个<strong>娱乐性质</strong>的平台，旨在为用户提供轻松幽默的学术内容分享体验。
                    本站所有内容不代表任何正经学术观点或立场，不构成任何形式的学术建议或专业指导。
                  </p>
                </div>
              </div>
            </div>

            {/* 第一条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                1. 服务性质声明
              </h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  1.1 OpenJunk（以下简称"本站"）是一个以娱乐为目的的内容分享平台，主要收录各类幽默、
                  讽刺性质的学术相关内容。
                </p>
                <p>
                  1.2 本站明确声明：所有内容仅供娱乐参考，不构成任何形式的学术建议、
                  专业指导或投资意见。用户应自行判断内容的真实性和适用性。
                </p>
                <p>
                  1.3 本站内容可能包含夸张、讽刺、幽默等表达方式，不应被理解为对任何个人、
                  机构或学术领域的真实评价。
                </p>
              </div>
            </div>

            {/* 第二条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                2. 用户责任
              </h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  2.1 用户在使用本站服务时，应遵守中华人民共和国相关法律法规，
                  不得发布违法违规内容。
                </p>
                <p>
                  2.2 用户应对自己发布的内容负责，确保不侵犯他人的知识产权、
                  名誉权、隐私权等合法权益。
                </p>
                <p>
                  2.3 用户理解并同意，使用本站内容产生的任何后果由用户自行承担，
                  本站不承担任何直接或间接责任。
                </p>
              </div>
            </div>

            {/* 第三条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">3. 内容规范</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  3.1 用户不得发布以下内容：
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>违反法律法规的内容</li>
                  <li>侵犯他人知识产权的内容</li>
                  <li>涉及国家机密或敏感信息的内容</li>
                  <li>恶意攻击、诽谤他人的内容</li>
                  <li>色情、暴力、恐怖等不良内容</li>
                  <li>垃圾信息或恶意营销内容</li>
                </ul>
                <p>
                  3.2 本站保留对违规内容进行删除、屏蔽或采取其他必要措施的权利，
                  并有权对违规用户进行警告、限制功能或封禁账号等处理。
                </p>
              </div>
            </div>

            {/* 第四条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">4. 免责声明</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  4.1 <strong>学术内容免责声明：</strong>本站收录的论文、期刊等内容均为娱乐性质，
                  不代表真实的学术评价。用户不应将这些内容作为学术研究的参考依据。
                </p>
                <p>
                  4.2 <strong>内容准确性免责声明：</strong>本站尽力维护内容的准确性，
                  但不保证所有内容的完全正确。用户应自行核实重要信息。
                </p>
                <p>
                  4.3 <strong>服务可用性免责声明：</strong>本站不保证服务的连续性、
                  及时性、安全性，对于因不可抗力或技术原因导致的服务中断不承担责任。
                </p>
                <p>
                  4.4 <strong>第三方链接免责声明：</strong>本站可能包含指向第三方网站的链接，
                  对于这些网站的内容和安全性，本站不承担责任。
                </p>
              </div>
            </div>

            {/* 第五条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">5. 知识产权</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  5.1 用户保留对其原创内容的知识产权。用户在本站发布内容，
                  即授予本站非独占的、免费的、全球性的使用权，用于展示、传播和推广该内容。
                </p>
                <p>
                  5.2 本站的品牌标识、界面设计、代码等知识产权归本站所有，
                  未经许可不得复制、修改或用于商业目的。
                </p>
                <p>
                  5.3 用户在使用本站服务时，应尊重他人的知识产权，
                  不得未经授权使用受版权保护的内容。
                </p>
              </div>
            </div>

            {/* 第六条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">6. 协议修改</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  6.1 本站保留随时修改本协议的权利。修改后的协议将在本站公示，
                  用户继续使用服务即视为接受修改后的协议。
                </p>
                <p>
                  6.2 如用户不同意修改后的协议，应立即停止使用本站服务。
                </p>
              </div>
            </div>

            {/* 第七条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">7. 争议解决</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  7.1 本协议的订立、执行和解释均适用中华人民共和国法律。
                </p>
                <p>
                  7.2 如发生与本协议相关的争议，双方应友好协商解决；
                  协商不成的，任何一方均可向本站所在地有管辖权的人民法院提起诉讼。
                </p>
              </div>
            </div>

            {/* 第八条 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">8. 联系我们</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  如对本协议有任何疑问，请通过以下方式联系我们：
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>小红书账号：OpenJunk</li>
                  <li>未来可能补充的其它渠道</li>
                </ul>
              </div>
            </div>

            {/* 生效日期 */}
            <div className="border-t pt-8 mt-12 text-center text-sm text-muted-foreground">
              <p>本协议最后更新日期：2026年3月11日</p>
              <p>本协议自发布之日起生效</p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
