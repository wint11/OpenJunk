'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

const awardApplicationSchema = z.object({
  awardId: z.string().min(1, "请选择奖项"),
  nomineeName: z.string().min(1, "请输入被提名人姓名").max(100),
  workDescription: z.string().max(2000, "描述过长").optional(),
  paperIds: z.string().optional(), // Comma separated IDs
})

export type FormState = {
  error?: string | {
    awardId?: string[]
    nomineeName?: string[]
    workDescription?: string[]
    paperIds?: string[]
  } | null
  success?: boolean
}

export async function submitAwardApplication(prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await auth()
  const user = session?.user

  const rawData = {
    awardId: formData.get('awardId'),
    nomineeName: formData.get('nomineeName'),
    workDescription: formData.get('workDescription'),
    paperIds: formData.get('paperIds'),
  }

  const validatedFields = awardApplicationSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { awardId, nomineeName, workDescription, paperIds } = validatedFields.data

  // Process paper IDs
  const papersToConnect = paperIds 
    ? paperIds.split(',').filter(id => id.trim().length > 0).map(id => ({ id: id.trim() }))
    : []

  try {
    await prisma.awardApplication.create({
      data: {
        awardId,
        applicantId: user?.id,
        nomineeName,
        workDescription,
        status: "PENDING",
        nominationPapers: papersToConnect.length > 0 ? {
          connect: papersToConnect
        } : undefined
      }
    })
  } catch (error) {
    console.error("Award application error:", error)
    return { error: "申请提交失败，请稍后重试" }
  }

  return { success: true }
}
