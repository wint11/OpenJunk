'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const updateSerialSchema = z.object({
  id: z.string(),
  projectNo: z.string().min(1, "编号不能为空")
})

export async function updateProjectNo(prevState: any, formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
    return { success: false, message: "无权操作" }
  }

  const data = {
    id: formData.get("id") as string,
    projectNo: formData.get("projectNo") as string
  }

  const validated = updateSerialSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: "格式错误",
      errors: validated.error.flatten().fieldErrors
    }
  }

  try {
    // Check uniqueness
    const existing = await prisma.fundApplication.findUnique({
      where: { projectNo: data.projectNo }
    })

    if (existing && existing.id !== data.id) {
      return { success: false, message: "该编号已存在" }
    }

    // Check permission
    const application = await prisma.fundApplication.findUnique({
        where: { id: data.id },
        include: { fund: true }
    })
    
    if (!application) return { success: false, message: "申请不存在" }

    if (session.user.role !== 'SUPER_ADMIN') {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { fundAdminCategories: true }
        })
        const hasPermission = user?.fundAdminCategories.some(c => c.id === application.fund.categoryId)
        if (!hasPermission) {
          return { success: false, message: "无权操作" }
        }
    }

    await prisma.fundApplication.update({
      where: { id: data.id },
      data: { projectNo: data.projectNo }
    })

    revalidatePath("/admin/fund/approvals")
    return { success: true, message: "编号更新成功" }
  } catch (error) {
    console.error("Update projectNo error:", error)
    return { success: false, message: "更新失败" }
  }
}
