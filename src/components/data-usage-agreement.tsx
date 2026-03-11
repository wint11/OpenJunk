import React from "react"

interface DataUsageAgreementProps {
  /** 用户名称 */
  userName?: string
  /** 日期 */
  date?: string
  /** 平台名称 */
  platformName?: string
  /** 额外的自定义内容 */
  children?: React.ReactNode
}

/**
 * 用户上传论文数据使用授权书组件
 * 
 * 用于展示用户上传论文数据的使用授权条款，适用于：
 * - AOI指数本地模型训练
 * - Junk宇宙内容分析
 * - 其他AI功能的数据使用
 */
export function DataUsageAgreement({
  userName = "用户",
  date = new Date().toLocaleDateString("zh-CN"),
  platformName = "OpenJunk",
  children,
}: DataUsageAgreementProps) {
  return (
    <div className="max-w-3xl mx-auto p-8 bg-white text-gray-900 leading-relaxed">
      {/* 标题 */}
      <h1 className="text-xl font-bold text-center mb-8">
        用户上传论文数据使用授权书
      </h1>

      {/* 授权方信息 */}
      <p className="mb-4">
        <strong>授权方（以下简称"甲方"）：</strong>{userName}
      </p>
      <p className="mb-6">
        <strong>被授权方（以下简称"乙方"）：</strong>{platformName}平台运营方
      </p>

      {/* 鉴于条款 */}
      <p className="mb-4">
        鉴于甲方拟通过乙方平台上传、存储、展示学术论文及相关资料（以下简称"上传内容"），为明确双方权利义务，就乙方对甲方上传内容的使用授权事宜，甲乙双方达成如下协议：
      </p>

      {/* 第一条 */}
      <div className="mb-6">
        <h2 className="font-bold mb-2">第一条 授权内容</h2>
        <p className="mb-2">
          1.1 甲方授权乙方使用其上传至{platformName}平台的论文数据，包括但不限于：
        </p>
        <p className="ml-4 mb-1">（1）论文全文内容（PDF格式或其他格式）</p>
        <p className="ml-4 mb-1">（2）论文元数据（标题、作者、摘要、关键词等）</p>
        <p className="ml-4 mb-2">（3）用户互动数据（评分、评论、投票等）</p>
        <p className="mb-2">
          1.2 授权使用范围包括：
        </p>
        <p className="ml-4 mb-1">（1）<strong>平台展示</strong>：在{platformName}平台及相关子服务中展示、检索、推荐</p>
        <p className="ml-4 mb-1">（2）<strong>AI训练</strong>：用于平台AI功能（包括但不限于AOI指数计算、内容分析、智能推荐等）的模型训练与优化</p>
        <p className="ml-4 mb-1">（3）<strong>学术研究</strong>：用于平台技术改进、学术研究及统计分析（脱敏处理后）</p>
        <p className="ml-4">（4）<strong>衍生服务</strong>：基于上传内容开发的衍生功能与服务（如Junk宇宙相关内容）</p>
      </div>

      {/* 第二条 */}
      <div className="mb-6">
        <h2 className="font-bold mb-2">第二条 授权期限</h2>
        <p>
          本授权自甲方上传内容之日起生效，至甲方删除该内容或注销账户之日终止。但对于已用于AI模型训练的数据，乙方有权在授权终止后继续保留训练后的模型参数及衍生成果。
        </p>
      </div>

      {/* 第三条 */}
      <div className="mb-6">
        <h2 className="font-bold mb-2">第三条 数据使用规范</h2>
        <p className="mb-2">
          3.1 乙方承诺按照以下规范使用甲方数据：
        </p>
        <p className="ml-4 mb-1">（1）<strong>合法合规</strong>：遵守《中华人民共和国数据安全法》《个人信息保护法》等相关法律法规</p>
        <p className="ml-4 mb-1">（2）<strong>脱敏处理</strong>：在用于AI训练及学术研究时，对作者身份信息、机构信息等敏感字段进行脱敏处理</p>
        <p className="ml-4 mb-1">（3）<strong>安全保护</strong>：采取技术措施保障数据安全，防止数据泄露、滥用或非法访问</p>
        <p className="ml-4 mb-2">（4）<strong>用途限制</strong>：不将甲方数据用于本授权书约定范围之外的商业用途</p>
        <p>
          3.2 未经甲方另行书面授权，乙方不得将原始论文内容向第三方出售或提供。
        </p>
      </div>

      {/* 第四条 */}
      <div className="mb-6">
        <h2 className="font-bold mb-2">第四条 用户权利</h2>
        <p className="mb-2">
          4.1 甲方享有以下权利：
        </p>
        <p className="ml-4 mb-1">（1）<strong>查看权</strong>：随时查看其上传内容在平台的使用情况</p>
        <p className="ml-4 mb-1">（2）<strong>修改权</strong>：对上传内容进行编辑、更新或补充</p>
        <p className="ml-4 mb-1">（3）<strong>删除权</strong>：随时删除其上传的内容（已用于AI训练的模型参数除外）</p>
        <p className="ml-4">（4）<strong>撤回权</strong>：有权随时撤回本授权，但撤回不影响撤回前已进行的数据处理活动</p>
      </div>

      {/* 第五条 */}
      <div className="mb-6">
        <h2 className="font-bold mb-2">第五条 免责条款</h2>
        <p className="mb-2">
          5.1 甲方保证对其上传内容拥有完整的知识产权或已获得必要的授权，上传内容不侵犯任何第三方的合法权益。
        </p>
        <p>
          5.2 因甲方上传内容侵犯第三方权益导致的纠纷，由甲方自行承担全部法律责任。
        </p>
      </div>

      {/* 第六条 */}
      <div className="mb-6">
        <h2 className="font-bold mb-2">第六条 争议解决</h2>
        <p>
          本授权书适用中华人民共和国法律。因本授权书引起的或与本授权书有关的任何争议，双方应友好协商解决；协商不成的，任何一方均可向乙方所在地有管辖权的人民法院提起诉讼。
        </p>
      </div>

      {/* 第七条 */}
      <div className="mb-8">
        <h2 className="font-bold mb-2">第七条 其他</h2>
        <p className="mb-2">
          7.1 本授权书构成双方就数据使用授权的完整协议，取代双方此前就同一事项达成的所有口头或书面约定。
        </p>
        <p className="mb-2">
          7.2 乙方有权根据法律法规变化或业务发展需要修改本授权书，修改后的内容将在平台公示，甲方继续使用视为接受修改。
        </p>
        <p>
          7.3 本授权书任何条款被认定为无效或不可执行，不影响其他条款的效力。
        </p>
      </div>

      {/* 签署 */}
      <div className="mt-12 pt-8 border-t border-gray-300">
        <p className="mb-6">
          <strong>甲方确认：</strong>本人已认真阅读并充分理解本授权书的全部内容，同意按照本授权书的约定授权乙方使用本人上传的论文数据。
        </p>
        
        <div className="flex justify-between mt-8">
          <div>
            <p className="mb-4"><strong>甲方（签字/确认）：</strong>_______________</p>
            <p><strong>日期：</strong>{date}</p>
          </div>
          <div>
            <p className="mb-4"><strong>乙方（盖章）：</strong>_______________</p>
            <p><strong>日期：</strong>{date}</p>
          </div>
        </div>
      </div>

      {/* 自定义内容 */}
      {children}
    </div>
  )
}

/**
 * 简版数据使用授权说明
 * 用于弹窗或简短展示场景
 */
export function DataUsageAgreementBrief({
  platformName = "OpenJunk",
}: Omit<DataUsageAgreementProps, "userName" | "date" | "children">) {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white text-gray-900 leading-relaxed">
      <h2 className="text-lg font-bold text-center mb-4">
        数据使用授权说明
      </h2>
      
      <p className="mb-4 text-sm">
        您上传的论文数据将被{platformName}平台用于以下用途：
      </p>
      
      <ol className="list-decimal list-inside space-y-2 text-sm mb-4">
        <li><strong>平台展示</strong>：在平台及相关服务中展示、检索、推荐您的论文</li>
        <li><strong>AI训练</strong>：用于AOI指数计算、内容分析、智能推荐等AI功能的模型训练</li>
        <li><strong>学术研究</strong>：用于技术改进及统计分析（脱敏处理后）</li>
        <li><strong>衍生服务</strong>：基于内容开发的衍生功能（如Junk宇宙）</li>
      </ol>
      
      <p className="text-sm mb-4">
        <strong>数据保护承诺：</strong>我们将对您的数据进行脱敏处理，去除作者身份信息等敏感字段，并采取安全措施防止数据泄露。
      </p>
      
      <p className="text-sm mb-4">
        <strong>您的权利：</strong>您可随时查看、修改、删除上传内容，或撤回本授权。
      </p>
      
      <p className="text-xs text-gray-500 mt-4">
        点击"同意"即表示您已阅读并同意上述数据使用授权条款。
      </p>
    </div>
  )
}

export default DataUsageAgreement
