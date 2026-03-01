'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { join } from "path"
import { writeFile, mkdir } from "fs/promises"

export async function createConference(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const location = formData.get("location") as string
  const startDateStr = formData.get("startDate") as string
  const endDateStr = formData.get("endDate") as string
  const status = formData.get("status") as string
  const coverFile = formData.get("cover") as File | null
  
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)

  let coverUrl = undefined
  if (coverFile && coverFile.size > 0) {
    const bytes = await coverFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), "public/uploads/conferences")
    try {
        await mkdir(uploadDir, { recursive: true })
    } catch (e) {}
    
    const fileName = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)
    coverUrl = `/uploads/conferences/${fileName}`
  }

  await prisma.conference.create({
    data: {
      name,
      description,
      location,
      startDate,
      endDate,
      status: status || "ACTIVE",
      coverUrl,
    },
  })

  revalidatePath("/admin/conferences/list")
}

export async function updateConference(id: string, formData: FormData) {
  const session = await auth()
  
  // Only SUPER_ADMIN can update conference details for now
  if (session?.user?.role !== "SUPER_ADMIN") {
    // Check if user is managed conference admin? (Optional future feature)
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const location = formData.get("location") as string
  const startDateStr = formData.get("startDate") as string
  const endDateStr = formData.get("endDate") as string
  const status = formData.get("status") as string
  const coverFile = formData.get("cover") as File | null

  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)

  let coverUrl = undefined
  if (coverFile && coverFile.size > 0) {
    const bytes = await coverFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), "public/uploads/conferences")
    try {
        await mkdir(uploadDir, { recursive: true })
    } catch (e) {}
    
    const fileName = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)
    coverUrl = `/uploads/conferences/${fileName}`
  }

  await prisma.conference.update({
    where: { id },
    data: {
      name,
      description,
      location,
      startDate,
      endDate,
      status,
      ...(coverUrl ? { coverUrl } : {}),
    },
  })

  revalidatePath("/admin/conferences/list")
}

export async function deleteConference(id: string) {
    const session = await auth()
    if (session?.user?.role !== "SUPER_ADMIN") {
      throw new Error("Unauthorized")
    }

    // Check if conference has papers or associated users
    const conference = await prisma.conference.findUnique({
        where: { id },
        include: {
            _count: {
                select: { papers: true, admins: true, reviewers: true }
            }
        }
    })

    if (conference && (conference._count.papers > 0 || conference._count.admins > 0 || conference._count.reviewers > 0)) {
        throw new Error("Cannot delete conference with associated papers or participants")
    }

    await prisma.conference.delete({
        where: { id }
    })
    
    revalidatePath("/admin/conferences/list")
}
