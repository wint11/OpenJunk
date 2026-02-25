'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const coverSchema = z.object({
    coverUrl: z.string().url("无效的图片链接")
})

export async function deleteNovel(novelId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const novel = await prisma.novel.findUnique({ where: { id: novelId } })
    if (!novel || novel.uploaderId !== session.user.id) {
        throw new Error("Forbidden")
    }

    // Allow deleting accepted manuscripts (PUBLISHED) as well as drafts/pending
    // User requested to support delete for accepted manuscripts.
    
    await prisma.novel.delete({
        where: { id: novelId }
    })

    await logAudit(
        "DELETE_NOVEL", 
        `Novel:${novelId}`, 
        `User ${session.user.name} deleted ${novel.title}`,
        session.user.id
    )

    revalidatePath('/author/works')
}

export async function withdrawNovel(novelId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const novel = await prisma.novel.findUnique({ where: { id: novelId } })
    if (!novel || novel.uploaderId !== session.user.id) {
        throw new Error("Forbidden")
    }

    if (novel.status !== 'PUBLISHED') {
        throw new Error("只有已发布的稿件才能撤稿")
    }

    // Set status to REJECTED to simulate withdrawal (since there is no WITHDRAWN status yet)
    // Or maybe we should use DRAFT if we want to allow re-edit?
    // Usually withdrawal implies taking it down. REJECTED is fine, or DRAFT.
    // If we use REJECTED, author can see it as rejected/withdrawn.
    // Let's use REJECTED for now as it removes it from public view.
    
    await prisma.novel.update({
        where: { id: novelId },
        data: { status: 'REJECTED' }
    })

    await logAudit(
        "WITHDRAW_NOVEL", 
        `Novel:${novelId}`, 
        `User ${session.user.name} withdrew ${novel.title}`,
        session.user.id
    )

    revalidatePath('/author/works')
}

export async function requestCoverUpdate(novelId: string, coverUrl: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const novel = await prisma.novel.findUnique({ where: { id: novelId } })
    if (!novel || novel.uploaderId !== session.user.id) {
        throw new Error("Forbidden")
    }

    const validation = coverSchema.safeParse({ coverUrl })
    if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message ?? "无效的图片链接")
    }

    await prisma.novel.update({
        where: { id: novelId },
        data: { pendingCoverUrl: coverUrl }
    })

    await logAudit(
        "REQUEST_COVER_UPDATE", 
        `Novel:${novelId}`, 
        `User ${session.user.name} requested cover update`,
        session.user.id
    )

    revalidatePath('/author/works')
}
