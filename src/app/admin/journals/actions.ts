'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { join } from "path"
import { writeFile, mkdir } from "fs/promises"

export async function createJournal(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const guidelines = formData.get("guidelines") as string
  const status = formData.get("status") as string
  const coverFile = formData.get("cover") as File | null
  const guidelinesFile = formData.get("guidelinesFile") as File | null
  const customCssFile = formData.get("customCss") as File | null

  let coverUrl = undefined
  if (coverFile && coverFile.size > 0) {
    const bytes = await coverFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Ensure directory exists
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
    
    // Ensure directory exists
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
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), "public/uploads/css")
    await mkdir(uploadDir, { recursive: true })
    
    const fileName = `style-${Date.now()}-${customCssFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    await writeFile(join(uploadDir, fileName), buffer)
    customCssUrl = `/uploads/css/${fileName}`
  }

  await prisma.journal.create({
    data: {
      name,
      description,
      guidelines,
      guidelinesUrl,
      customCssUrl,
      status: status || "ACTIVE",
      coverUrl,
    },
  })

  revalidatePath("/admin/journals")
}

export async function updateJournal(id: string, formData: FormData) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Allow SUPER_ADMIN or the Journal Admin managing this journal
  let isAllowed = session.user.role === "SUPER_ADMIN"
  if (!isAllowed) {
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { managedJournalId: true }
    })
    if (user?.managedJournalId === id) {
        isAllowed = true
    }
  }

  if (!isAllowed) {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const guidelines = formData.get("guidelines") as string
  const status = formData.get("status") as string
  const coverFile = formData.get("cover") as File | null
  const guidelinesFile = formData.get("guidelinesFile") as File | null
  const deleteGuidelinesFile = formData.get("deleteGuidelinesFile") === "true"
  const customCssFile = formData.get("customCss") as File | null
  const deleteCustomCss = formData.get("deleteCustomCss") === "true"

  let coverUrl = undefined
  if (coverFile && coverFile.size > 0) {
    const bytes = await coverFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), "public/uploads/journals")
    await mkdir(uploadDir, { recursive: true })
    
    const fileName = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    await writeFile(join(uploadDir, fileName), buffer)
    coverUrl = `/uploads/journals/${fileName}`
  }

  let guidelinesUrl: string | null | undefined = undefined
  if (guidelinesFile && guidelinesFile.size > 0) {
    const bytes = await guidelinesFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), "public/uploads/guidelines")
    await mkdir(uploadDir, { recursive: true })
    
    const fileName = `${Date.now()}-${guidelinesFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    await writeFile(join(uploadDir, fileName), buffer)
    guidelinesUrl = `/uploads/guidelines/${fileName}`
  } else if (deleteGuidelinesFile) {
    guidelinesUrl = null
  }

  let customCssUrl: string | null | undefined = undefined
  if (customCssFile && customCssFile.size > 0) {
    const bytes = await customCssFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), "public/uploads/css")
    await mkdir(uploadDir, { recursive: true })
    
    const fileName = `style-${Date.now()}-${customCssFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    await writeFile(join(uploadDir, fileName), buffer)
    customCssUrl = `/uploads/css/${fileName}`
  } else if (deleteCustomCss) {
    customCssUrl = null
  }

  await prisma.journal.update({
    where: { id },
    data: {
      name,
      description,
      guidelines,
      status,
      ...(coverUrl ? { coverUrl } : {}),
      ...(guidelinesUrl !== undefined ? { guidelinesUrl } : {}),
      ...(customCssUrl !== undefined ? { customCssUrl } : {}),
    },
  })

  revalidatePath("/admin/journals")
}

export async function deleteJournal(id: string) {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized")
    }

    // Check if journal has papers or editors
    const journal = await prisma.journal.findUnique({
        where: { id },
        include: {
            _count: {
                select: { papers: true, admins: true, reviewers: true }
            }
        }
    })

    if (journal && (journal._count.papers > 0 || journal._count.admins > 0 || journal._count.reviewers > 0)) {
        throw new Error("Cannot delete journal with associated papers or editors")
    }

    await prisma.journal.delete({
        where: { id }
    })
    
    revalidatePath("/admin/journals")
}
