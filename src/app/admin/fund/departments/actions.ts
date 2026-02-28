'use server'

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

const departmentSchema = z.object({
  name: z.string().min(2, "名称至少2个字符"),
  code: z.string().min(1, "代码至少1个字符"),
  categoryId: z.string().min(1, "请选择所属基金大类"),
  description: z.string().optional(),
})

export async function createFundDepartment(prevState: any, formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
    return { success: false, message: "无权操作" }
  }

  const data = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    categoryId: formData.get("categoryId") as string,
    description: formData.get("description") as string,
  }

  const validated = departmentSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: "表单验证失败",
      errors: validated.error.flatten().fieldErrors
    }
  }

  // Permission check for FUND_ADMIN
  if (session.user.role !== 'SUPER_ADMIN') {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { fundAdminCategories: true }
    })
    const hasPermission = user?.fundAdminCategories.some(c => c.id === data.categoryId)
    if (!hasPermission) {
      return { success: false, message: "无权在该基金大类下创建部门" }
    }
  }

  try {
    // Check if code exists in this category
    const existing = await prisma.fundDepartment.findUnique({
      where: {
        categoryId_code: {
          categoryId: data.categoryId,
          code: data.code
        }
      }
    })

    if (existing) {
      return {
        success: false,
        message: "该大类下已存在此部门代码"
      }
    }

    // Check if name exists in this category
    const existingName = await prisma.fundDepartment.findUnique({
        where: {
            categoryId_name: {
                categoryId: data.categoryId,
                name: data.name
            }
        }
    })

    if (existingName) {
        return {
            success: false,
            message: "该大类下已存在此部门名称"
        }
    }

    await prisma.fundDepartment.create({
      data: {
        name: data.name,
        code: data.code,
        categoryId: data.categoryId,
        description: data.description,
      }
    })

    revalidatePath("/admin/fund/departments")
    return { success: true, message: "部门创建成功" }
  } catch (error) {
    console.error("Create department error:", error)
    return { success: false, message: "创建失败，请稍后重试" }
  }
}

export async function deleteFundDepartment(id: string) {
  const session = await auth()
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
    return { success: false, message: "无权操作" }
  }

  try {
    const department = await prisma.fundDepartment.findUnique({
        where: { id },
        include: { category: true }
    })
    
    if (!department) return { success: false, message: "部门不存在" }

    if (session.user.role !== 'SUPER_ADMIN') {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { fundAdminCategories: true }
        })
        const hasPermission = user?.fundAdminCategories.some(c => c.id === department.categoryId)
        if (!hasPermission) {
          return { success: false, message: "无权操作" }
        }
    }

    await prisma.fundDepartment.delete({
      where: { id }
    })
    revalidatePath("/admin/fund/departments")
    return { success: true }
  } catch (error) {
    console.error("Delete department error:", error)
    return { success: false, message: "删除失败，可能该部门下有关联数据" }
  }
}
