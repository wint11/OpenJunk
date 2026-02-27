
'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function approveApplication(applicationId: string) {
  const session = await auth()
  if (!session || !session.user) {
    return { error: "未授权操作" }
  }

  try {
    // Verify permission (Admin of the award or Super Admin)
    const application = await prisma.awardApplication.findUnique({
      where: { id: applicationId },
      include: { award: true }
    })

    if (!application) return { error: "申请不存在" }

    // Check if user manages this award
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    const isSuperAdmin = user?.role === 'SUPER_ADMIN'
    const isAwardAdmin = user?.managedAwardId === application.awardId

    if (!isSuperAdmin && !isAwardAdmin) {
      return { error: "无权操作此申请" }
    }

    await prisma.awardApplication.update({
      where: { id: applicationId },
      data: { status: 'APPROVED' }
    })

    revalidatePath('/admin/awards/applications')
    return { success: true }
  } catch (error) {
    console.error("Approve application error:", error)
    return { error: "操作失败" }
  }
}

export async function rejectApplication(applicationId: string) {
  const session = await auth()
  if (!session || !session.user) {
    return { error: "未授权操作" }
  }

  try {
    // Verify permission (Admin of the award or Super Admin)
    const application = await prisma.awardApplication.findUnique({
      where: { id: applicationId },
      include: { award: true }
    })

    if (!application) return { error: "申请不存在" }

    // Check if user manages this award
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    const isSuperAdmin = user?.role === 'SUPER_ADMIN'
    const isAwardAdmin = user?.managedAwardId === application.awardId

    if (!isSuperAdmin && !isAwardAdmin) {
      return { error: "无权操作此申请" }
    }

    await prisma.awardApplication.update({
      where: { id: applicationId },
      data: { status: 'REJECTED' }
    })

    revalidatePath('/admin/awards/applications')
    return { success: true }
  } catch (error) {
    console.error("Reject application error:", error)
    return { error: "操作失败" }
  }
}
