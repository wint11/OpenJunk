import { Button } from "@/components/ui/button";
import { getContestStatus, getTestMode } from "./actions";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

export default async function PPTContestPage() {
  const { stage, now, dates } = await getContestStatus();
  const TEST_MODE = await getTestMode();
  
  // Format date for display
  const formatDate = (date: Date) => date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
          第一届“乱讲PPT”大赛
        </h1>
        <p className="text-xl text-muted-foreground mb-4">
          史上最离谱、最无厘头的学术PPT演讲比赛
        </p>
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
          {TEST_MODE ? "测试模式 (所有功能已开启)" : (
              <>
                {stage === 0 && "即将开始"}
                {stage === 1 && "第一阶段：PPT上传中"}
                {stage === 1.5 && "等待第二阶段开启"}
                {stage === 2 && "第二阶段：即兴乱讲中"}
                {stage === 2.5 && "等待第三阶段开启"}
                {stage === 3 && "第三阶段：大众评审中"}
                {stage === 4 && "比赛已结束"}
              </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <StageCard 
          title="第一阶段：制作上传" 
          date={`${formatDate(dates.STAGE1_START)} - ${formatDate(dates.STAGE1_END)}`}
          description="所有人都可以上传PPT，每人限传3个。内容必须一本正经地胡说八道。"
          isActive={TEST_MODE || stage === 1}
          isPast={!TEST_MODE && stage > 1}
          link="/ppt-contest-1/stage1"
          actionText="去上传"
        />
        <StageCard 
          title="第二阶段：即兴乱讲" 
          date={`${formatDate(dates.STAGE2_START)} - ${formatDate(dates.STAGE2_END)}`}
          description="随机抽取陌生人的PPT，即兴录制5分钟内的演讲。看谁反应快，看谁编得圆。"
          isActive={TEST_MODE || stage === 2}
          isPast={!TEST_MODE && stage > 2}
          link="/ppt-contest-1/stage2"
          actionText="去挑战"
        />
        <StageCard 
          title="第三阶段：大众评比" 
          date={`${formatDate(dates.STAGE3_START)} - ${formatDate(dates.STAGE3_END)}`}
          description="所有人匿名投票，选出最精彩的“乱讲”作品。"
          isActive={TEST_MODE || stage === 3}
          isPast={!TEST_MODE && stage > 3}
          link="/ppt-contest-1/stage3"
          actionText="去投票"
        />
      </div>

      <Separator className="my-8" />
      
      <div className="text-center text-muted-foreground">
          <p className="max-w-2xl mx-auto italic">
              “在这里，PPT做得再好也没用，关键看你能不能把‘没有意义’讲出‘意义非凡’的感觉。”
          </p>
      </div>

      <div className="mt-12 text-sm text-muted-foreground text-center">
        <p>最终解释权归 OpenJunk 所有。</p>
      </div>
    </div>
  );
}

function StageCard({ title, date, description, isActive, isPast, link, actionText }: { title: string, date: string, description: string, isActive: boolean, isPast: boolean, link: string, actionText: string }) {
  const isLocked = !isActive && !isPast;

  return (
    <div className={`flex flex-col p-6 rounded-lg border transition-all ${isActive ? 'bg-background shadow-lg border-primary ring-1 ring-primary' : 'bg-muted/50 opacity-70'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-bold ${isActive ? 'text-primary' : ''}`}>{title}</h3>
        {isActive && <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>}
        {isPast && <span className="text-xs font-bold text-green-600">已结束</span>}
        {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="text-xs font-mono text-muted-foreground mb-3">{date}</p>
      <p className="text-sm flex-1 mb-4">{description}</p>
      
      <Button asChild variant={isActive ? "default" : "secondary"} disabled={isLocked} className="w-full">
          {isLocked ? (
              <span>敬请期待</span>
          ) : (
              <Link href={link}>
                  {actionText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
          )}
      </Button>
    </div>
  )
}
