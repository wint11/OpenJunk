'use server'

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { join } from "path"
import { writeFile, mkdir } from "fs/promises"
import bcrypt from "bcryptjs"
import { signIn } from "@/auth"

export async function createJournalAndAdmin(formData: FormData) {
  // Journal Data
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const guidelines = formData.get("guidelines") as string
  const coverFile = formData.get("cover") as File | null
  const guidelinesFile = formData.get("guidelinesFile") as File | null
  const customCssFile = formData.get("customCss") as File | null

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

  // Handle Files (Journal)
  let coverUrl = undefined
  if (coverFile && coverFile.size > 0) {
    const bytes = await coverFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadDir = join(process.cwd(), "public/uploads/journals")
    await mkdir(uploadDir, { recursive: true })
    const fileName = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    await writeFile(join(uploadDir, fileName), buffer)
    coverUrl = `/uploads/journals/${fileName}`
  }

  let guidelinesUrl = undefined
  if (guidelinesFile && guidelinesFile.size > 0) {
    const bytes = await guidelinesFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadDir = join(process.cwd(), "public/uploads/guidelines")
    await mkdir(uploadDir, { recursive: true })
    const fileName = `${Date.now()}-${guidelinesFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    await writeFile(join(uploadDir, fileName), buffer)
    guidelinesUrl = `/uploads/guidelines/${fileName}`
  }

  let customCssUrl = undefined
  if (customCssFile && customCssFile.size > 0) {
    const bytes = await customCssFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadDir = join(process.cwd(), "public/uploads/css")
    await mkdir(uploadDir, { recursive: true })
    const fileName = `style-${Date.now()}-${customCssFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    await writeFile(join(uploadDir, fileName), buffer)
    customCssUrl = `/uploads/css/${fileName}`
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(userPassword, 10)

  // Transaction: Create Journal + Create User (Admin)
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create Journal
      const journal = await tx.journal.create({
        data: {
          name,
          description,
          guidelines,
          guidelinesUrl,
          customCssUrl,
          status: "ACTIVE", // Default to active for autonomy
          coverUrl,
        },
      })

      // 2. Create User (Admin) linked to Journal
      await tx.user.create({
        data: {
          name: userName,
          email: userEmail,
          password: hashedPassword,
          role: "ADMIN",
          managedJournalId: journal.id,
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
    console.error("Failed to create journal and admin:", error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: "创建期刊和管理员失败" }
  }

  return { success: true }
}
