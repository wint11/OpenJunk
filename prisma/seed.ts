import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

// Load .env file manually to ensure it's available
dotenv.config({ path: path.join(__dirname, '../.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('正在重置数据库...')
  
  // Clean up existing data
  await prisma.readingHistory.deleteMany()
  await prisma.chapter.deleteMany()
  await prisma.novel.deleteMany()
  await prisma.journal.deleteMany() // Add this
  await prisma.auditLog.deleteMany()
  await prisma.user.deleteMany()

  console.log('正在生成演示数据...')

  const passwordHash = await bcrypt.hash('123456', 10)

  // Create Journals
  const journalCommunication = await prisma.journal.create({
    data: {
      name: 'Rubbish Communication',
      description: '专注于垃圾信息的传播与交流，只要是能说话的我们都收。',
      status: 'ACTIVE'
    }
  })

  const journalLitter = await prisma.journal.create({
    data: {
      name: 'Litter',
      description: '随手乱扔的学术垃圾，这里是它们最好的归宿。',
      status: 'ACTIVE'
    }
  })

  const journalAnthropology = await prisma.journal.create({
    data: {
      name: 'Rubbish Anthropology',
      description: '研究人类制造垃圾的历史与文化，深入挖掘垃圾背后的社会意义。',
      status: 'ACTIVE'
    }
  })

  const journalEconomics = await prisma.journal.create({
    data: {
      name: 'AmericanEconomicRubbish',
      description: '美式经济学垃圾，通货膨胀、泡沫经济，这里应有尽有。',
      status: 'ACTIVE'
    }
  })

  const journalEngineering = await prisma.journal.create({
    data: {
      name: 'Rubbish Engineering',
      description: '豆腐渣工程的理论基础，致力于构建最不稳定的结构。',
      status: 'ACTIVE'
    }
  })

  // New Journals
  const journalLitterBehaviour = await prisma.journal.create({
    data: {
      name: 'Litter Human Behaviour',
      description: '研究人类乱扔垃圾的行为模式。',
      status: 'ACTIVE'
    }
  })

  const journalAcademicBullshit = await prisma.journal.create({
    data: {
      name: 'Academic Bullshit',
      description: '专门收录学术界的废话文学。',
      status: 'ACTIVE'
    }
  })

  const journalRubbishPsychiatry = await prisma.journal.create({
    data: {
      name: 'Rubbish Psychiatry',
      description: '精神病学的垃圾场，什么理论都敢收。',
      status: 'ACTIVE'
    }
  })

  // Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: '总编',
      password: passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    }
  })

  // Create Journal Admin (Editors)
  const editorCommunication = await prisma.user.create({
    data: {
      email: 'rc001@openjunk.com',
      name: 'Rubbish Communication 主编',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      managedJournalId: journalCommunication.id
    }
  })

  const editorLitter = await prisma.user.create({
    data: {
      email: 'litter001@openjunk.com',
      name: 'Litter 主编',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      managedJournalId: journalLitter.id
    }
  })

  const editorAnthropology = await prisma.user.create({
    data: {
      email: 'ra001@openjunk.com',
      name: 'Rubbish Anthropology 主编',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      managedJournalId: journalAnthropology.id
    }
  })

  const editorEconomics = await prisma.user.create({
    data: {
      email: 'aer001@openjunk.com',
      name: 'AmericanEconomicRubbish 主编',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      managedJournalId: journalEconomics.id
    }
  })

  const editorEngineering = await prisma.user.create({
    data: {
      email: 're001@openjunk.com',
      name: 'Rubbish Engineering 主编',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      managedJournalId: journalEngineering.id
    }
  })

  // New Journal Editors
  const editorLitterBehaviour = await prisma.user.create({
    data: {
      email: 'Lhb4874@openjunk.com',
      name: 'Litter Human Behaviour 主编',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      managedJournalId: journalLitterBehaviour.id
    }
  })

  const editorAcademicBullshit = await prisma.user.create({
    data: {
      email: 'Ab0019623@openjunk.com',
      name: 'Academic Bullshit 主编',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      managedJournalId: journalAcademicBullshit.id
    }
  })

  const editorRubbishPsychiatry = await prisma.user.create({
    data: {
      email: 'rp001@openjunk.com',
      name: 'Rubbish Psychiatry 主编',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      managedJournalId: journalRubbishPsychiatry.id
    }
  })

  // Create Papers
  const papers = [
    {
      title: '基于Transformer的自然语言处理前沿综述',
      author: '张博士 等',
      description: '本文详细回顾了Transformer架构在NLP领域的演变历程，从最初的Attention机制到如今的大语言模型（LLMs）。分析了各种变体的优缺点，并探讨了未来的发展方向。',
      category: '计算机科学',
      type: 'ARTICLE',
      coverUrl: 'https://placehold.co/400x600/png?text=NLP+Review',
      pdfUrl: '/uploads/pdfs/sample.pdf',
      rating: 4.8,
      views: 12000,
      uploaderId: admin.id,
      isRecommended: true,
    },
    {
      title: '深度残差网络在医学图像诊断中的应用',
      author: '李教授 等',
      description: '探讨了ResNet在X光片和MRI图像分析中的应用。通过改进残差块结构，显著提高了早期肿瘤检测的准确率。',
      category: '医学',
      type: 'PAPER',
      coverUrl: 'https://placehold.co/400x600/png?text=Medical+AI',
      pdfUrl: '/uploads/pdfs/sample.pdf',
      rating: 4.9,
      views: 8500,
      uploaderId: admin.id,
      isRecommended: true,
    },
    {
      title: '量子计算对现代密码学的挑战与机遇',
      author: '张博士',
      description: '量子霸权时代即将到来，传统的RSA加密面临巨大威胁。本文分析了后量子密码学（PQC）的最新进展。',
      category: '物理学',
      type: 'PAPER',
      coverUrl: 'https://placehold.co/400x600/png?text=Quantum',
      pdfUrl: '/uploads/pdfs/sample.pdf',
      rating: 4.7,
      views: 6000,
      uploaderId: admin.id,
      isRecommended: false,
    },
    {
      title: '全球气候变化对生物多样性的影响评估',
      author: '李教授',
      description: '基于过去50年的气候数据，评估了温升对热带雨林生态系统的长期影响。模型预测显示...。',
      category: '环境科学',
      type: 'PAPER',
      coverUrl: 'https://placehold.co/400x600/png?text=Climate',
      pdfUrl: '/uploads/pdfs/sample.pdf',
      rating: 4.6,
      views: 5500,
      uploaderId: admin.id,
      isRecommended: false,
    },
    {
      title: '高性能固态电池材料的最新研究进展',
      author: '王研究员',
      description: '针对电动汽车续航焦虑，本文综述了新型固态电解质材料的导电性能和稳定性。',
      category: '材料科学',
      type: 'ARTICLE',
      coverUrl: 'https://placehold.co/400x600/png?text=Battery',
      pdfUrl: '/uploads/pdfs/sample.pdf',
      rating: 4.5,
      views: 4800,
      uploaderId: admin.id,
      isRecommended: true,
    },
    {
      title: '生成式人工智能在艺术创作中的伦理边界',
      author: '赵学者',
      description: 'AI绘画引发了关于版权和原创性的激烈讨论。本文从法律和伦理角度分析了这一新兴现象。',
      category: '社会科学',
      type: 'ARTICLE',
      coverUrl: 'https://placehold.co/400x600/png?text=AI+Ethics',
      pdfUrl: '/uploads/pdfs/sample.pdf',
      rating: 4.9,
      views: 15000,
      uploaderId: admin.id,
      isRecommended: true,
    },
    {
      title: '通货膨胀与垃圾回收价格的相关性分析',
      author: '钱教授',
      description: '通过对过去十年的数据分析，发现废纸回收价格与CPI指数呈现高度正相关。',
      category: '经济学',
      type: 'PAPER',
      coverUrl: 'https://placehold.co/400x600/png?text=Inflation',
      pdfUrl: '/uploads/pdfs/sample.pdf',
      rating: 4.2,
      views: 3200,
      uploaderId: admin.id,
      isRecommended: false,
    }
  ]

  for (const p of papers) {
    let journalId = journalLitter.id // Default

    if (p.category === '计算机科学' || p.title.includes('人工智能')) {
      journalId = journalCommunication.id
    } else if (p.category === '社会科学' || p.category === '环境科学') {
      journalId = journalAnthropology.id
    } else if (p.category === '物理学' || p.category === '材料科学') {
      journalId = journalEngineering.id
    } else if (p.category === '经济学') {
      journalId = journalEconomics.id
    }

    await prisma.novel.create({
      data: {
        ...p,
        status: 'PUBLISHED',
        journalId: journalId
        // No chapters created, just PDF papers
      },
    })
  }

  console.log('数据重置完成！')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
