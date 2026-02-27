'use server'

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { join } from "path"
import { writeFile, mkdir } from "fs/promises"
import bcrypt from "bcryptjs"
import { signIn } from "@/auth"

export async function createAwardAndAdmin(formData: FormData) {
  // Award Data
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const criteria = formData.get("criteria") as string
  const coverFile = formData.get("cover") as File | null

  // User Data (Admin)
  const userName = formData.get("userName") as string
  const userEmail = formData.get("userEmail") as string
  const userPassword = formData.get("userPassword") as string

  // Validation
  if (!name || !description || !userName || !userEmail || !userPassword) {
    throw new Error("请填写所有必填字段")
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail }
  })
  if (existingUser) {
    throw new Error("该邮箱已被注册")
  }

  // Handle Files (Award)
  let coverUrl = undefined
  if (coverFile && coverFile.size > 0) {
    const bytes = await coverFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadDir = join(process.cwd(), "public/uploads/awards")
    await mkdir(uploadDir, { recursive: true })
    const fileName = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    await writeFile(join(uploadDir, fileName), buffer)
    coverUrl = `/uploads/awards/${fileName}`
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(userPassword, 10)

  // Transaction: Create Award + Create User (Admin)
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create Award
      const award = await tx.award.create({
        data: {
          name,
          description,
          criteria,
          status: "ACTIVE", 
          coverUrl,
        },
      })

      // 2. Create User (Admin) linked to Award
      await tx.user.create({
        data: {
          name: userName,
          email: userEmail,
          password: hashedPassword,
          role: "ADMIN",
          managedAwardId: award.id,
          status: "ACTIVE",
        },
      })
    })

    // Auto login
    await signIn("credentials", {
      email: userEmail,
      password: userPassword,
      redirect: false,
    })

  } catch (error) {
    console.error("Failed to create award and admin:", error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: "创建奖项和管理员失败" }
  }

  return { success: true }
}
