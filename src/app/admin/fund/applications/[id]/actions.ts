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

  // Permission check
  if (session.user.role !== 'SUPER_ADMIN') {
    const application = await prisma.fundApplication.findUnique({
      where: { id: applicationId },
      include: { fund: true }
    })
    
    if (!application) return { success: false, message: '申请不存在' }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { fundAdminCategories: true }
    })
    
    const hasPermission = user?.fundAdminCategories.some(c => c.id === application.fund.categoryId)
    if (!hasPermission) {
        return { success: false, message: '无权操作此申请' }
    }
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
      // Logic for Project No generation
      let projectNoUpdate = {}
      if (newStatus === 'APPROVED') {
          const app = await tx.fundApplication.findUnique({
              where: { id: applicationId },
              include: { fund: true, department: true }
          })
          
          if (app && !app.projectNo) {
              const deptCode = app.department?.code ? app.department.code.charAt(0) : '0'
              const yearShort = app.fund.year.toString().slice(-2)
              const typeChar = app.fund.projectTypeChar || 'A'
              const customNum = app.fund.customNumber || '0'
              
              // Count existing approved projects with projectNo in this fund & department
              const count = await tx.fundApplication.count({
                  where: {
                      fundId: app.fundId,
                      departmentId: app.departmentId,
                      status: 'APPROVED',
                      projectNo: { not: null }
                  }
              })
              
              const sequence = (count + 1).toString().padStart(3, '0')
              projectNoUpdate = {
                  projectNo: `${deptCode}${yearShort}${typeChar}${customNum}${sequence}`
              }
          }
      }

      // Update application status
      await tx.fundApplication.update({
        where: { id: applicationId },
        data: {
          status: newStatus,
          ...projectNoUpdate
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

export async function revokeApplication(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: '无权操作' }
  }

  const applicationId = formData.get('applicationId') as string

  if (!applicationId) {
    return { success: false, message: '参数缺失' }
  }

  // Permission check
  if (session.user.role !== 'SUPER_ADMIN') {
    const application = await prisma.fundApplication.findUnique({
      where: { id: applicationId },
      include: { fund: true }
    })
    
    if (!application) return { success: false, message: '申请不存在' }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { fundAdminCategories: true }
    })
    
    const hasPermission = user?.fundAdminCategories.some(c => c.id === application.fund.categoryId)
    if (!hasPermission) {
        return { success: false, message: '无权操作此申请' }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Reset status to SUBMITTED
      await tx.fundApplication.update({
        where: { id: applicationId },
        data: {
          status: 'SUBMITTED',
        }
      })

      // 2. Delete all review records associated with this application
      // Since we are "revoking/undoing", we assume the reviews are invalid or part of the test
      await tx.fundReview.deleteMany({
        where: { applicationId }
      })
    })

    revalidatePath(`/admin/fund/applications/${applicationId}`)
    revalidatePath(`/admin/fund/applications`)
    return { success: true, message: '已撤销立项状态，重置为已提交' }
  } catch (error: any) {
    console.error('Revoke error:', error)
    return { success: false, message: '撤销失败: ' + error.message }
  }
}
