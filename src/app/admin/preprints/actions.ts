
'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function reviewPreprintUpdate(formData: FormData) {
  const session = await auth()
  
  // Verify admin
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized")
  }

  const preprintId = formData.get("preprintId") as string
  const action = formData.get("action") as string // approve | reject

  if (!preprintId || !action) {
    throw new Error("Missing parameters")
  }

  const preprint = await prisma.preprint.findUnique({
    where: { id: preprintId }
  })

  if (!preprint) {
    throw new Error("Preprint not found")
  }

  if (action === "approve") {
    // Apply changes
    await prisma.preprint.update({
      where: { id: preprintId },
      data: {
        title: preprint.pendingTitle || preprint.title,
        abstract: preprint.pendingAbstract || preprint.abstract,
        authors: preprint.pendingAuthors || preprint.authors,
        pdfUrl: preprint.pendingPdfUrl || preprint.pdfUrl,
        
        // Clear pending fields
        pendingTitle: null,
        pendingAbstract: null,
        pendingAuthors: null,
        pendingPdfUrl: null,
        updateStatus: "IDLE"
      }
    })
  } else if (action === "reject") {
    // Clear pending fields only
    await prisma.preprint.update({
      where: { id: preprintId },
      data: {
        pendingTitle: null,
        pendingAbstract: null,
        pendingAuthors: null,
        pendingPdfUrl: null,
        updateStatus: "REJECTED"
      }
    })
  }

  revalidatePath("/admin/preprints")
  revalidatePath(`/preprints/${preprintId}`)
}
