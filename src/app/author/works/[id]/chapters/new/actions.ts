'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { logAudit } from '@/lib/audit'
import { getAiReviewEnabled } from '@/lib/app-settings'
import { runAiPreReview } from '@/lib/ai-pre-review'

const chapterSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题过长"),
  content: z.string().min(100, "正文至少100个字"),
  novelId: z.string().min(1, "作品ID不能为空"),
  isVip: z.boolean().optional(),
})

export type ChapterFormState = {
  error?: string | {
    title?: string[]
    content?: string[]
    novelId?: string[]
  } | null
}

export async function createChapter(prevState: ChapterFormState, formData: FormData): Promise<ChapterFormState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "未登录" }
  }

  const rawData = {
    title: formData.get('title'),
    content: formData.get('content'),
    novelId: formData.get('novelId'),
    isVip: formData.get('isVip') === 'on',
  }

  const validatedFields = chapterSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { title, content, novelId, isVip } = validatedFields.data

  try {
    // Verify ownership
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { uploaderId: true, title: true, description: true, aiReviewedAt: true }
    })

    if (!novel || novel.uploaderId !== session.user.id) {
      return { error: "无权操作此作品" }
    }

    // Get current chapter count to set order
    const count = await prisma.chapter.count({
      where: { novelId }
    })

    const order = count + 1
    const chapter = await prisma.chapter.create({
      data: {
        title,
        content,
        novelId,
        order,
        isVip,
      }
    })

    // Update novel updatedAt
    await prisma.novel.update({
      where: { id: novelId },
      data: { updatedAt: new Date() }
    })

    if (order === 1 && !novel.aiReviewedAt && (await getAiReviewEnabled())) {
      const aiResult = await runAiPreReview({
        title: novel.title,
        description: novel.description,
        content,
      })

      await prisma.novel.update({
        where: { id: novelId },
        data: {
          aiReviewPassed: aiResult.pass,
          aiQuality: aiResult.qualityScore,
          aiReviewedAt: new Date(),
          aiReviewRaw: aiResult.rawJson,
        },
      })
    }

    await logAudit("CREATE_CHAPTER", `Chapter:${chapter.id}`, `Created chapter: ${title} for Novel:${novelId}`, session.user.id)
  } catch (error) {
    console.error("Failed to create chapter:", error)
    return { error: "数据库错误" }
  }

  redirect('/author/works')
}
