'use server'

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

const adminSchema = z.object({
  email: z.string().email("请输入有效的邮箱"),
  password: z.string().min(6, "密码至少6个字符"),
  categoryId: z.string().min(1, "请选择一个管理的基金大类")
})

export async function createFundAdmin(prevState: any, formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    categoryId: formData.get("categoryId") as string
  }

  const validated = adminSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: "表单验证失败",
      errors: validated.error.flatten().fieldErrors
    }
  }

  try {
    // 检查邮箱是否存在
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      if (existingUser.role === 'USER') {
        // Upgrade existing user
        const hashedPassword = await bcrypt.hash(data.password, 10)
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: "ADMIN",
            password: hashedPassword, // Reset password
            fundAdminCategories: {
              connect: [{ id: data.categoryId }]
            }
          }
        })
        revalidatePath("/admin/fund/admins")
        return { success: true, message: "已将该用户升级为基金管理员" }
      } else {
        return {
          success: false,
          message: "该邮箱已被其他管理员或特殊角色占用"
        }
      }
    }

    // 创建新用户并关联基金大类
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    await prisma.user.create({
      data: {
        email: data.email,
        name: "基金管理员", // Default name
        password: hashedPassword, 
        role: "ADMIN",
        fundAdminCategories: {
          connect: [{ id: data.categoryId }]
        }
      }
    })

    revalidatePath("/admin/fund/admins")
    return { success: true, message: "基金管理员创建成功" }
  } catch (error) {
    console.error("Create admin error:", error)
    return { success: false, message: "创建失败，请稍后重试" }
  }
}

export async function deleteFundAdmin(adminId: string) {
  try {
    // 物理删除用户
    await prisma.user.delete({
      where: { id: adminId }
    })
    revalidatePath("/admin/fund/admins")
    return { success: true }
  } catch (error) {
    console.error("Delete admin error:", error)
    return { success: false, message: "操作失败，可能该用户有关联数据无法删除" }
  }
}
