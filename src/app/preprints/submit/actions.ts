
'use server'

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import { headers } from "next/headers"

const preprintSchema = z.object({
  title: z.string().min(1, "标题至少1个字符"),
  abstract: z.string().min(1, "摘要至少1个字符"),
  authors: z.string().min(1, "作者至少1个字符"),
  // fileUrl: z.string().url("无效的文件链接"), // Replaced by file upload logic
  // keywords: z.string().optional(),
  // doi: z.string().optional(),
})

export type FormState = {
  error?: string | {
    title?: string[]
    abstract?: string[]
    authors?: string[]
    // fileUrl?: string[]
    // keywords?: string[]
    // doi?: string[]
  } | null
  success?: boolean
}

export async function submitPreprint(prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await auth()
  
  // Get IP address for anonymous submissions
  const headersList = await headers()
  const uploaderIp = headersList.get("x-forwarded-for") || "127.0.0.1"

  const rawData = {
    title: formData.get("title"),
    abstract: formData.get("abstract"),
    authors: formData.get("authors"),
    // fileUrl: formData.get("fileUrl"),
    // keywords: formData.get("keywords"),
    // doi: formData.get("doi"),
  }

  const file = formData.get("file") as File
  if (!file || file.size === 0) {
    return { error: "请上传文件" }
  }

  const validatedFields = preprintSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { title, abstract, authors } = validatedFields.data
  
  let fileUrl = ""
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "public/uploads/pdfs")
    await mkdir(uploadDir, { recursive: true })

    // Create unique filename
    // Keep original extension if possible, or default to .pdf
    const originalName = file.name
    const ext = originalName.substring(originalName.lastIndexOf('.'))
    const fileName = `${uuidv4()}${ext}`
    
    await writeFile(join(uploadDir, fileName), buffer)
    fileUrl = `/uploads/pdfs/${fileName}`
  } catch (error) {
    console.error("File upload failed:", error)
    return { error: "文件上传失败" }
  }

  try {
    await prisma.preprint.create({
      data: {
        title,
        abstract,
        authors,
        pdfUrl: fileUrl,
        uploaderId: session?.user?.id || null, // Optional if logged in
        uploaderIp: uploaderIp, // Record IP
      }
    })
  } catch (error) {
    console.error("Failed to create preprint:", error)
    return { error: "提交失败，请稍后重试" }
  }

  return { success: true }
}
