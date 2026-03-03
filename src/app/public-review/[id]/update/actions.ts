
'use server'

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const updateSchema = z.object({
  title: z.string().min(1, "标题至少1个字符"),
  abstract: z.string().min(1, "摘要至少1个字符"),
  authors: z.string().min(1, "作者至少1个字符"),
})

export type FormState = {
  error?: string | {
    title?: string[]
    abstract?: string[]
    authors?: string[]
  } | null
  success?: boolean
}

export async function updatePreprint(preprintId: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await auth()
  
  // Verify user is logged in
  if (!session?.user?.id) {
    return { error: "请先登录" }
  }

  const preprint = await prisma.preprint.findUnique({
    where: { id: preprintId }
  })

  if (!preprint) {
    return { error: "Preprint not found" }
  }

  // Allow updates if:
  // 1. User is logged in and is the uploader
  // 2. User is Super Admin
  const isUploader = session.user.id === preprint.uploaderId
  const isSuperAdmin = session.user.role === "SUPER_ADMIN"

  if (!isUploader && !isSuperAdmin) {
    return { error: "您没有权限更新此预印本" }
  }

  const rawData = {
    title: formData.get("title"),
    abstract: formData.get("abstract"),
    authors: formData.get("authors"),
  }

  const validatedFields = updateSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { title, abstract, authors } = validatedFields.data
  
  let pendingPdfUrl = undefined
  const file = formData.get("file") as File
  
  if (file && file.size > 0) {
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const { mkdir, writeFile } = await import("fs/promises")
      const { join } = await import("path")
      const { v4: uuidv4 } = await import("uuid")

      const uploadDir = join(process.cwd(), "public/uploads/pdfs")
      await mkdir(uploadDir, { recursive: true })

      const originalName = file.name
      const ext = originalName.substring(originalName.lastIndexOf('.'))
      const fileName = `${uuidv4()}${ext}`
      const filePath = join(uploadDir, fileName)
      
      await writeFile(filePath, buffer)
      pendingPdfUrl = `/uploads/pdfs/${fileName}`
    } catch (error) {
      console.error("File upload failed:", error)
      return { error: "文件上传失败" }
    }
  }

  try {
    await prisma.preprint.update({
      where: { id: preprintId },
      data: {
        pendingTitle: title,
        pendingAbstract: abstract,
        pendingAuthors: authors,
        ...(pendingPdfUrl ? { pendingPdfUrl } : {}),
        updateStatus: "PENDING"
      }
    })
  } catch (error) {
    console.error("Failed to update preprint:", error)
    return { error: "更新提交失败，请稍后重试" }
  }
  
  revalidatePath(`/preprints/${preprintId}`)
  return { success: true }
}
