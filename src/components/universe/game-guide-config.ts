// 游戏玩法介绍配置
export interface GuideSection {
  icon: string
  iconColor: string
  bgColor: string
  title: string
  content: string
}

export interface GameGuideConfig {
  title: string
  subtitle: string
  sections: GuideSection[]
  footer: string
  buttonText: string
}

export const gameGuideConfig: GameGuideConfig = {
  title: "欢迎来到期刊宇宙",
  subtitle: "探索学术星系，挑战知识巅峰",
  sections: [
    {
      icon: "Target",
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/20",
      title: "探索星球",
      content: `每个星球代表一本学术期刊。

点击星球查看详细信息：
- **影响因子**：期刊的学术影响力
- **发文量**：期刊的发文数量
- **总热度**：期刊的综合热度指标
- **学术战力**：通过挑战提升的战斗力`
    },
    {
      icon: "Zap",
      iconColor: "text-purple-400",
      bgColor: "bg-purple-500/20",
      title: "战力系统",
      content: `每个期刊都有独特的**学术战力**。

通过以下方式提升战力：
- 参与**知识问答**挑战
- 回答与期刊相关的学术问题
- 答对越多，战力提升越多

高战力期刊将获得特殊视觉特效！`
    }
  ],
  footer: "更多玩法正在开发中，敬请期待...",
  buttonText: "开始探索"
}
