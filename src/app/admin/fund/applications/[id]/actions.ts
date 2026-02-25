'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function reviewApplication(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: '无权操作' }
  }

  const applicationId = formData.get('applicationId') as string
  const action = formData.get('action') as string // APPROVE or REJECT
  const comments = formData.get('comments') as string

  if (!applicationId || !action) {
    return { success: false, message: '参数缺失' }
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

  try {
    // Check if expert profile exists for the admin
    let expertProfile = await prisma.fundExpertProfile.findUnique({
      where: { userId: session.user.id }
    })

    // If not, create a hidden expert profile for this admin just for logging reviews
    if (!expertProfile) {
      expertProfile = await prisma.fundExpertProfile.create({
        data: {
          userId: session.user.id,
          realName: session.user.name || 'Admin',
          isActive: true
        }
      })
    }

    await prisma.$transaction(async (tx) => {
      // Update application status
      await tx.fundApplication.update({
        where: { id: applicationId },
        data: {
          status: newStatus,
        }
      })

      // Create review record
      await tx.fundReview.create({
        data: {
          applicationId,
          expertId: expertProfile!.id,
          score: action === 'APPROVE' ? 100 : 0,
          grade: action === 'APPROVE' ? 'A' : 'D',
          comments: comments || (action === 'APPROVE' ? '行政审批通过' : '行政审批驳回'),
          status: 'SUBMITTED'
        }
      })
    })

    revalidatePath(`/admin/fund/applications/${applicationId}`)
    revalidatePath(`/admin/fund/applications`)
    return { success: true, message: `操作成功: ${newStatus === 'APPROVED' ? '已立项' : '已驳回'}` }
  } catch (error: any) {
    console.error('Review error:', error)
    return { success: false, message: '操作失败: ' + error.message }
  }
}
