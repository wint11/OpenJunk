'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { compare, hash } from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function updatePassword(prevState: any, formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: "未登录或会话已过期" }
  }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "请填写所有必填字段" }
  }

  if (newPassword !== confirmPassword) {
    return { error: "两次输入的密码不一致" }
  }

  if (newPassword.length < 6) {
    return { error: "新密码长度至少为6位" }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return { error: "用户不存在" }
    }

    if (!user.password) {
      return { error: "当前账号未设置密码（可能是通过第三方登录），无法修改密码" }
    }

    const isPasswordValid = await compare(currentPassword, user.password)

    if (!isPasswordValid) {
      return { error: "当前密码错误" }
    }

    const hashedPassword = await hash(newPassword, 10)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    })

    revalidatePath("/profile")
    return { success: true, message: "密码修改成功" }
  } catch (error) {
    console.error("Failed to update password:", error)
    return { error: "修改密码失败，请稍后重试" }
  }
}
