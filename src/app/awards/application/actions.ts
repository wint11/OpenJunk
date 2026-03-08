'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const awardApplicationSchema = z.object({
  awardId: z.string().min(1, "请选择奖项"),
  cycleId: z.string().min(1, "请选择申请周期"),
  trackId: z.string().min(1, "请选择申请赛道"),
  journalId: z.string().optional(),
  nomineeType: z.enum(["INDIVIDUAL", "TEAM", "JOURNAL"]),
  nomineeName: z.string().max(100, "名称过长").optional(),
  workDescription: z.string().max(2000, "描述过长").optional(),
  paperIds: z.string().optional(),
})

export type FormState = {
  error?: string | {
    awardId?: string[]
    cycleId?: string[]
    trackId?: string[]
    journalId?: string[]
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
    cycleId: formData.get('cycleId'),
    trackId: formData.get('trackId'),
    journalId: formData.get('journalId'),
    nomineeType: formData.get('nomineeType'),
    nomineeName: formData.get('nomineeName'),
    workDescription: formData.get('workDescription'),
    paperIds: formData.get('paperIds'),
  }

  const validatedFields = awardApplicationSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { awardId, cycleId, trackId, journalId, nomineeType, nomineeName, workDescription, paperIds } = validatedFields.data

  // 验证周期是否开放
  const cycle = await prisma.awardCycle.findUnique({
    where: { id: cycleId }
  })

  if (!cycle) {
    return { error: "所选周期不存在" }
  }

  if (cycle.status === 'CLOSED' || cycle.status === 'ANNOUNCED') {
    return { error: "该周期已结束，无法接受新申请" }
  }

  if (cycle.status === 'UPCOMING') {
    const now = new Date()
    if (now < cycle.startDate) {
      return { error: "该周期尚未开始" }
    }
  }

  // 验证赛道是否属于该奖项
  const track = await prisma.awardTrack.findUnique({
    where: { id: trackId }
  })

  if (!track || track.awardId !== awardId) {
    return { error: "所选赛道无效" }
  }

  // 根据被提名者类型验证必填字段
  if (nomineeType === 'JOURNAL') {
    if (!journalId) {
      return { error: { journalId: ["请选择被提名的期刊"] } }
    }
    // 验证期刊是否存在
    const journal = await prisma.journal.findUnique({
      where: { id: journalId }
    })
    if (!journal) {
      return { error: "所选期刊不存在" }
    }
  } else {
    if (!nomineeName || nomineeName.trim().length === 0) {
      return { error: { nomineeName: ["请输入被提名者名称"] } }
    }
  }

  // Process paper IDs
  const papersToConnect = paperIds 
    ? paperIds.split(',').filter(id => id.trim().length > 0).map(id => ({ id: id.trim() }))
    : []

  try {
    await prisma.awardApplication.create({
      data: {
        awardId,
        cycleId,
        trackId,
        journalId: nomineeType === 'JOURNAL' ? journalId : null,
        applicantId: user?.id,
        nomineeName: nomineeType === 'JOURNAL' ? null : (nomineeName || ''),
        nomineeType,
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
