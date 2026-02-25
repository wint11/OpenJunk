'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().min(1, "昵称不能为空").max(50, "昵称过长"),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z.string().min(6, "新密码至少6位"),
  confirmPassword: z.string().min(6, "确认密码至少6位"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
})

export async function updateProfile(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "未登录" }

  const rawData = {
    name: formData.get("name"),
  }

  const validated = profileSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: validated.data.name },
    })
    
    revalidatePath("/profile")
    return { success: true, message: "个人信息已更新" }
  } catch (error) {
    return { error: "更新失败" }
  }
}

export async function updatePassword(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "未登录" }

  const rawData = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  }

  const validated = passwordSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { currentPassword, newPassword } = validated.data

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user || !user.password) {
    return { error: "用户不存在或未设置密码" }
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password)
  if (!isMatch) {
    return { error: "当前密码错误" }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })
    
    revalidatePath("/profile")
    return { success: true, message: "密码已修改" }
  } catch (error) {
    return { error: "修改失败" }
  }
}
