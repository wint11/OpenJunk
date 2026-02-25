import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('正在初始化基金数据...')

  // Try to find existing categories or create new ones
  const catNsfc = await prisma.fundCategory.upsert({
    where: { code: 'NSFC' },
    update: {
      name: '自燃科学鸡精',
      description: '支持非正常人类研究，培养炸厨房人才'
    },
    create: {
      name: '自燃科学鸡精',
      code: 'NSFC',
      description: '支持非正常人类研究，培养炸厨房人才'
    }
  })

  const catNssfc = await prisma.fundCategory.upsert({
    where: { code: 'NSSFC' },
    update: {
      name: '社会磕学鸡精',
      description: '繁荣发展八卦磕学家'
    },
    create: {
      name: '社会磕学鸡精',
      code: 'NSSFC',
      description: '繁荣发展八卦磕学家'
    }
  })

  const today = new Date()
  const nextMonth = new Date(today)
  nextMonth.setMonth(today.getMonth() + 1)
  
  const lastMonth = new Date(today)
  lastMonth.setMonth(today.getMonth() - 1)

  // Check if funds exist to avoid duplicates if run multiple times
  const existingFund = await prisma.fund.findFirst({
    where: { title: '2026年度面上项目' }
  })

  if (!existingFund) {
    // Active Fund
    await prisma.fund.create({
      data: {
        title: '2026年度泡面加蛋项目',
        year: 2026,
        categoryId: catNsfc.id,
        startDate: lastMonth,
        endDate: nextMonth,
        status: 'ACTIVE',
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
  }

  const existingFund2 = await prisma.fund.findFirst({
    where: { title: '2026年度青年摸鱼基金项目' }
  })

  if (!existingFund2) {
    // Upcoming Fund
    await prisma.fund.create({
      data: {
        title: '2026年度青年摸鱼基金项目',
        year: 2026,
        categoryId: catNsfc.id,
        startDate: nextMonth,
        endDate: new Date(nextMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        guideContent: '本基金旨在资助那些在上班时间能够高效摸鱼且不被发现的优秀青年人才。'
      }
    })
  }

  const existingFund3 = await prisma.fund.findFirst({
    where: { title: '2026年度社会磕学重大八卦项目' }
  })

  if (!existingFund3) {
    // Active NSSFC Fund
    await prisma.fund.create({
      data: {
        title: '2026年度社会磕学重大八卦项目',
        year: 2026,
        categoryId: catNssfc.id,
        startDate: today,
        endDate: nextMonth,
        status: 'ACTIVE',
        guideContent: '面向全社会征集重大八卦线索，开展跨学科吃瓜研究。'
      }
    })
  }

  console.log('基金数据初始化完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
