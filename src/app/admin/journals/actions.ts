'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createJournal(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const status = formData.get("status") as string

  await prisma.journal.create({
    data: {
      name,
      description,
      status: status || "ACTIVE",
    },
  })

  revalidatePath("/admin/journals")
}

export async function updateJournal(id: string, formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const status = formData.get("status") as string

  await prisma.journal.update({
    where: { id },
    data: {
      name,
      description,
      status,
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
