import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始更新基金项目标题和内容...')

  // 更新 "2026年度面上项目" -> "2026年度泡面加蛋项目"
  const updateMs = await prisma.fund.updateMany({
    where: { title: '2026年度面上项目' },
    data: { 
      title: '2026年度泡面加蛋项目', 
      guideContent: `
# 2026年度泡面加蛋项目申报指南

## 一、资助范围
本年度泡面加蛋项目主要资助在实验室熬夜时的营养补充研究。

## 二、申报要求
1. 申请人应当是长期熬夜的科研民工。
2. 具有熟练掌握三种以上泡面烹饪技巧。
3. 承诺加蛋必须是溏心蛋。

## 三、申报流程
请如实填写申报书，特别是想加什么蛋。
      `
    }
  })
  console.log(`Updated 面上项目: ${updateMs.count} records`)

  // 更新 "2026年度青年科学基金项目" -> "2026年度青年摸鱼基金项目"
  const updateQn = await prisma.fund.updateMany({
    where: { title: '2026年度青年科学基金项目' },
    data: { 
      title: '2026年度青年摸鱼基金项目', 
      guideContent: '本基金旨在资助那些在上班时间能够高效摸鱼且不被发现的优秀青年人才。'
    }
  })
  console.log(`Updated 青年基金: ${updateQn.count} records`)

  // 更新 "2026年度国家社科基金重大项目" -> "2026年度社会磕学重大八卦项目"
  const updateZd = await prisma.fund.updateMany({
    where: { title: '2026年度国家社科基金重大项目' },
    data: { 
      title: '2026年度社会磕学重大八卦项目', 
      guideContent: '面向全社会征集重大八卦线索，开展跨学科吃瓜研究。'
    }
  })
  console.log(`Updated 重大项目: ${updateZd.count} records`)

  console.log('基金项目内容更新完毕！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
