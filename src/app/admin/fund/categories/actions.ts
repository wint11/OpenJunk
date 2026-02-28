'use server'

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const categorySchema = z.object({
  name: z.string().min(2, "名称至少2个字符"),
  code: z.string().min(2, "代码至少2个字符").regex(/^[A-Z0-9]+$/, "代码只能包含大写字母和数字"),
  description: z.string().optional(),
})

export async function createFundCategory(prevState: any, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    description: formData.get("description") as string,
  }

  const validated = categorySchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: "表单验证失败",
      errors: validated.error.flatten().fieldErrors
    }
  }

  try {
    const existing = await prisma.fundCategory.findUnique({
      where: { code: data.code }
    })

    if (existing) {
      return {
        success: false,
        message: "该基金代码已存在"
      }
    }

    await prisma.fundCategory.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
      }
    })

    revalidatePath("/admin/fund/categories")
    return { success: true, message: "基金大类创建成功" }
  } catch (error) {
    console.error("Create category error:", error)
    return { success: false, message: "创建失败，请稍后重试" }
  }
}

export async function updateFundCategory(id: string, prevState: any, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    description: formData.get("description") as string,
  }

  const validated = categorySchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: "表单验证失败",
      errors: validated.error.flatten().fieldErrors
    }
  }

  try {
    // Check for duplicate code if code is changed
    const existing = await prisma.fundCategory.findFirst({
      where: { 
        code: data.code,
        id: { not: id }
      }
    })

    if (existing) {
      return {
        success: false,
        message: "该基金代码已存在"
      }
    }

    await prisma.fundCategory.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
      }
    })

    revalidatePath("/admin/fund/categories")
    return { success: true, message: "基金大类更新成功" }
  } catch (error) {
    console.error("Update category error:", error)
    return { success: false, message: "更新失败，请稍后重试" }
  }
}

export async function deleteFundCategory(id: string) {
  try {
    // Check for existing relations before deleting
    const category = await prisma.fundCategory.findUnique({
        where: { id },
        include: {
            _count: {
                select: { funds: true, departments: true }
            }
        }
    })

    if (category) {
        if (category._count.funds > 0) {
            return { success: false, message: `删除失败：该分类下有 ${category._count.funds} 个关联基金项目，请先删除项目。` }
        }
        if (category._count.departments > 0) {
            return { success: false, message: `删除失败：该分类下有 ${category._count.departments} 个关联部门，请先删除部门。` }
        }
    }

    await prisma.fundCategory.delete({
      where: { id }
    })
    revalidatePath("/admin/fund/categories")
    return { success: true, message: "删除成功" }
  } catch (error) {
    console.error("Delete category error:", error)
    return { success: false, message: "删除失败，可能该分类下有关联数据" }
  }
}
