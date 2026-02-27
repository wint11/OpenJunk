
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function updateAward(awardId: string, formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") {
    return { error: "无权执行此操作" }
  }

  const description = formData.get("description") as string
  const criteria = formData.get("criteria") as string
  const status = formData.get("status") as string

  try {
    await prisma.award.update({
      where: { id: awardId },
      data: {
        description,
        criteria,
        status
      }
    })
    
    revalidatePath(`/admin/awards/${awardId}`)
    revalidatePath(`/admin/awards`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "更新失败" }
  }
}
