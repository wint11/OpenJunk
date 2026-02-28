'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { join } from "path"
import { writeFile, mkdir } from "fs/promises"

export async function updateFundCategoryIntro(id: string, prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, message: '未登录' }
  }

  // Check permission
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { fundAdminCategories: true }
  })

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const hasPermission = isSuperAdmin || user?.fundAdminCategories.some(c => c.id === id)

  if (!hasPermission) {
    return { success: false, message: '无权操作该基金大类' }
  }

  const introContent = formData.get("introContent") as string
  const imageFile = formData.get("introImage") as File | null

  try {
    let introImages = undefined
    
    // Handle Image Upload
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uploadDir = join(process.cwd(), "public/uploads/fund-org")
      await mkdir(uploadDir, { recursive: true })
      
      // Generate unique filename
      const ext = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const filePath = join(uploadDir, fileName)
      
      await writeFile(filePath, buffer)
      introImages = `/uploads/fund-org/${fileName}`
    }

    const updateData: any = {
      introContent
    }
    
    if (introImages) {
      updateData.introImages = introImages
    }

    await prisma.fundCategory.update({
      where: { id },
      data: updateData
    })

    revalidatePath("/admin/fund/organization")
    revalidatePath("/fund/organization")
    
    return { success: true, message: "组织介绍更新成功" }
  } catch (error) {
    console.error("Update fund intro error:", error)
    return { success: false, message: "更新失败，请稍后重试" }
  }
}
