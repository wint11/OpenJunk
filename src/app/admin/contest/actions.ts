'use server'

import { prisma } from "@/lib/prisma"
import { readdir, stat, rm } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

const UPLOAD_DIRS = [
    'ppt-contest',
    'ppt-contest-preview',
    'ppt-contest-audio'
]

interface FileInfo {
    name: string
    size: number
    date: Date
}

interface DirectoryStats {
    count: number
    size: number
    files: FileInfo[]
}

interface ContestStats {
    submissions: number
    interpretations: number
    files: {
        [key: string]: DirectoryStats
    }
    totalFileSize: number
}

export async function getContestStats(): Promise<ContestStats> {
    const session = await auth()
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        throw new Error("无权访问")
    }

    // DB Stats
    const submissions = await prisma.pPTSubmission.count()
    const interpretations = await prisma.pPTInterpretation.count()

    // File Stats
    const files: { [key: string]: DirectoryStats } = {}
    let totalFileSize = 0

    for (const dir of UPLOAD_DIRS) {
        const dirPath = join(process.cwd(), 'public', 'uploads', dir)
        let count = 0
        let size = 0
        const fileList: FileInfo[] = []

        if (existsSync(dirPath)) {
            try {
                const entries = await readdir(dirPath)
                count = entries.length
                for (const entry of entries) {
                    const filePath = join(dirPath, entry)
                    const stats = await stat(filePath)
                    if (stats.isFile()) {
                        size += stats.size
                        fileList.push({
                            name: entry,
                            size: stats.size,
                            date: stats.mtime
                        })
                    }
                }
            } catch (e) {
                console.error(`Error reading directory ${dir}:`, e)
            }
        }
        
        // Sort files by date desc
        fileList.sort((a, b) => b.date.getTime() - a.date.getTime())

        files[dir] = { count, size, files: fileList }
        totalFileSize += size
    }

    return {
        submissions,
        interpretations,
        files,
        totalFileSize
    }
}

export async function clearContestData() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        return { success: false, message: "无权操作" }
    }

    try {
        // 1. Clear DB (Cascade delete will handle interpretations)
        await prisma.pPTSubmission.deleteMany()
        
        // Also delete any interpretations that might be orphaned (though cascade should handle it)
        // Just to be safe/clean if there were any issues
        await prisma.pPTInterpretation.deleteMany()

        // 2. Clear Files
        for (const dir of UPLOAD_DIRS) {
            const dirPath = join(process.cwd(), 'public', 'uploads', dir)
            if (existsSync(dirPath)) {
                // Delete all files in the directory
                const entries = await readdir(dirPath)
                for (const entry of entries) {
                    const filePath = join(dirPath, entry)
                    await rm(filePath, { force: true })
                }
            }
        }

        return { success: true, message: "赛事数据已全部清空" }
    } catch (e: any) {
        console.error("Clear contest data error:", e)
        return { success: false, message: e.message || "清空失败" }
    } finally {
        revalidatePath("/admin/contest")
    }
}
