'use server'

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { put } from "@vercel/blob"
import fs from "fs"
import path from "path"
import { convertPptToPdf } from "@/lib/ppt-converter"

export async function getTestMode() {
    return false; // TEST_MODE is disabled
}


// Contest Dates
const DATES = {
    STAGE1_START: new Date("2026-03-16T00:00:00+08:00"),
    STAGE1_END: new Date("2026-03-30T23:59:59+08:00"),
    STAGE2_START: new Date("2026-03-31T00:00:00+08:00"),
    STAGE2_END: new Date("2026-04-15T23:59:59+08:00"),
    STAGE3_START: new Date("2026-04-16T00:00:00+08:00"),
    STAGE3_END: new Date("2026-04-30T23:59:59+08:00"),
};

export async function getContestStatus() {
    // const now = new Date();
    // For development/testing, allow overriding via query param if needed, but for now just use current date
    // Or hardcode to test specific stages if requested
    const now = new Date();

    let stage = 0;
    // Before start
    if (now < DATES.STAGE1_START) stage = 0;
    else if (now >= DATES.STAGE1_START && now <= DATES.STAGE1_END) stage = 1;
    else if (now > DATES.STAGE1_END && now < DATES.STAGE2_START) stage = 1.5; // Intermission 1
    else if (now >= DATES.STAGE2_START && now <= DATES.STAGE2_END) stage = 2;
    else if (now > DATES.STAGE2_END && now < DATES.STAGE3_START) stage = 2.5; // Intermission 2
    else if (now >= DATES.STAGE3_START && now <= DATES.STAGE3_END) stage = 3;
    else if (now > DATES.STAGE3_END) stage = 4; // Ended

    return {
        stage,
        now: now.toISOString(),
        dates: DATES
    };
}

export async function convertPPTForPreview(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) return { error: "未找到文件" };

    try {
        // 使用stream方式读取文件，避免arrayBuffer可能导致的Chrome扩展错误
        const chunks: Uint8Array[] = [];
        const reader = file.stream().getReader();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        
        const buffer = Buffer.concat(chunks);
        
        console.log("Attempting to convert PPT to PDF for preview...");
        const pdfBuffer = await convertPptToPdf(buffer);
        
        // Save to local public/uploads/ppt-contest-preview as requested
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `preview_${Date.now()}_${safeName.replace(/\.(ppt|pptx)$/i, '.pdf')}`;
        
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ppt-contest-preview');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, pdfBuffer);
        
        const previewUrl = `/uploads/ppt-contest-preview/${filename}`;
        
        return { success: true, previewUrl };
    } catch (e) {
        console.error("Preview conversion failed:", e);
        return { error: "预览生成失败。请确保PPT文件未加密、未设置“只读”保护，且内容完整。建议另存为新文件后重试。" };
    }
}

export async function submitPPT(formData: FormData) {
    const status = await getContestStatus();
    const testMode = await getTestMode();
    // Allow upload in stage 1, or in TEST_MODE
    if (!testMode && status.stage !== 1) {
        return { error: "当前不在PPT上传阶段 (3月16日-3月31日)" };
    }

    const file = formData.get('file') as File;
    if (!file) return { error: "未找到文件" };
    
    const email = formData.get('email') as string | null;

    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";

    // Check IP limit
    let count = 0;
    try {
        count = await prisma.pPTSubmission.count({
            where: { uploaderIp: ip }
        });
    } catch (e) {
        console.error("Database error:", e);
        // Fail open or closed? Let's fail open for now but log it, or return error
        return { error: "数据库连接失败" };
    }

    if (count >= 3 && !testMode) {
        return { error: "每个IP最多只能上传3个PPT" };
    }

    try {
        // 使用stream方式读取文件，避免arrayBuffer可能导致的Chrome扩展错误
        const chunks: Uint8Array[] = [];
        const reader = file.stream().getReader();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        
        const buffer = Buffer.concat(chunks);
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const baseFilename = `${Date.now()}-${safeName}`;
        
        // 1. Save to Local Storage (Primary)
        let localFileUrl: string | null = null;
        try {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ppt-contest');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            
            const filePath = path.join(uploadDir, baseFilename);
            fs.writeFileSync(filePath, buffer);
            localFileUrl = `/uploads/ppt-contest/${baseFilename}`;
        } catch (e) {
            console.error("Local save failed", e);
        }

        // 2. Upload to Vercel Blob (Backup/Remote) - Optional
        let fileUrl: string | null = null;
        try {
            // Non-blocking upload to avoid delaying the user
            put(`ppt-contest/${baseFilename}`, file, { access: 'public' })
                .then(blob => {
                     // We could update the DB here if needed, but for now we just fire and forget or let it fail
                     // Actually, if we want to store the URL, we should wait, or use a background job.
                     // But user said "local success is success".
                     // Let's make it a "best effort" parallel promise that doesn't block the main flow if possible, 
                     // OR just await it but catch errors silently so it doesn't fail the request.
                     // The user explicitly said "vercel is not mandatory".
                     // So we will await it (to keep logic simple) but NOT fail if it errors.
                })
                .catch(e => console.error("Vercel upload failed (background):", e));
        } catch (e) {
            console.error("Vercel upload setup failed", e);
        }
        
        // 3. Handle PDF Preview
        let previewUrl: string | null = null; // Remote
        let localPreviewUrl: string | null = null; // Local
        
        if (file.name.match(/\.(ppt|pptx)$/i)) {
            try {
                console.log("Generating PDF preview...");
                const pdfBuffer = await convertPptToPdf(buffer);
                const pdfFilename = baseFilename.replace(/\.(ppt|pptx)$/i, '.pdf');
                
                // Save Local PDF
                const previewDir = path.join(process.cwd(), 'public', 'uploads', 'ppt-contest-preview');
                if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });
                
                const pdfPath = path.join(previewDir, pdfFilename);
                fs.writeFileSync(pdfPath, pdfBuffer);
                localPreviewUrl = `/uploads/ppt-contest-preview/${pdfFilename}`;
                
                // Upload Remote PDF - Optional
                try {
                    put(`ppt-contest-preview/${pdfFilename}`, pdfBuffer, { 
                        access: 'public', 
                        contentType: 'application/pdf' 
                    }).then(blob => {
                        // Background upload
                    }).catch(e => console.error("Vercel preview upload failed (background)", e));
                } catch (e) {
                    console.error("Vercel preview upload setup failed", e);
                }
                
                console.log("PPT conversion successful. Local:", localPreviewUrl);
            } catch (convertError) {
                console.warn("PPT conversion failed:", convertError);
            }
        } else if (file.name.match(/\.pdf$/i)) {
            // For PDF files, use the original file as preview
            localPreviewUrl = localFileUrl;
            console.log("PDF file, using original as preview:", localPreviewUrl);
        }
        
        // 4. Save to Database
        // We might not have fileUrl/previewUrl if we made them background tasks.
        // But since local is primary, that's fine.
        
        await prisma.pPTSubmission.create({
            data: {
                title: file.name.replace(/\.(pdf|ppt|pptx)$/i, ''),
                uploaderIp: ip,
                uploaderEmail: email || null,
                // Store local URLs primarily. Remote ones might be null if background upload hasn't finished or failed.
                // If we really wanted to store remote URLs, we'd have to await. 
                // But user said "local success is success".
                // So let's just store null for remote for now to speed it up, 
                // OR we can keep await but catch error.
                // Let's stick to the previous pattern but make sure we don't return error if Vercel fails.
                
                // Actually, to properly support "background upload", we can't save the URL here immediately if we don't await.
                // So let's just NOT upload to Vercel in the main blocking flow if it's not required.
                // Or better: await it but ignore errors completely.
                
                fileUrl: null,          
                localFileUrl: localFileUrl,
                previewUrl: null,    
                localPreviewUrl: localPreviewUrl 
            }
        });

        // Trigger background uploads after DB write? No, Vercel functions might kill the process.
        // For now, let's just skip Vercel upload to make it fast as requested, or keep it but make it non-blocking for the user response?
        // "vercel的不是必须的" -> implies we can skip it or treat it as optional.
        // Let's removing the blocking await for Vercel entirely to speed up response.
        
        // Fire and forget Vercel uploads (might not finish in serverless, but works in Node server)
        // Re-implementing Vercel upload block to be purely background/optional
        // and NOT storing their URLs in this transaction since we don't wait for them.
        
        // Background upload for main file
        put(`ppt-contest/${baseFilename}`, file, { access: 'public' })
            .then(async (blob) => {
                 // Update DB with Vercel URL later
                 try {
                     const submission = await prisma.pPTSubmission.findFirst({
                         where: { localFileUrl: localFileUrl },
                         orderBy: { createdAt: 'desc' }
                     });
                     if (submission) {
                         await prisma.pPTSubmission.update({
                             where: { id: submission.id },
                             data: { fileUrl: blob.url }
                         });
                     }
                 } catch (err) {
                     console.error("Failed to update Vercel URL in DB", err);
                 }
            })
            .catch(e => console.error("Vercel background upload failed:", e));

        return { success: true, previewUrl: localPreviewUrl };
    } catch (e) {
        console.error(e);
        return { error: "上传失败" };
    }
}

export async function getRandomPPTForRecording() {
    // Stage 2 only
    // Logic: Get a random PPT. 
    
    const count = await prisma.pPTSubmission.count();
    if (count === 0) return null;
    
    const skip = Math.floor(Math.random() * count);
    const ppt = await prisma.pPTSubmission.findFirst({
        skip
    });
    
    if (!ppt) return null;

    return {
        ...ppt,
        // Prioritize local URLs if available
        fileUrl: ppt.localFileUrl || ppt.fileUrl,
        previewUrl: ppt.localPreviewUrl || ppt.previewUrl
    };
}

export async function submitInterpretation(formData: FormData) {
    const status = await getContestStatus();
    const testMode = await getTestMode();
    if (!testMode && status.stage !== 2) {
        return { error: "当前不在录音阶段 (3月31日-4月15日)" };
    }

    const audio = formData.get('audio') as File;
    const submissionId = formData.get('submissionId') as string;
    const duration = parseInt(formData.get('duration') as string) || 0;
    const timestamps = formData.get('timestamps') as string;

    if (!audio || !submissionId) return { error: "数据不完整" };

    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";

    try {
        const buffer = Buffer.from(await audio.arrayBuffer());
        const filename = `interpretation/${Date.now()}-${submissionId}.webm`;
        
        // 1. Save to Local Storage (Primary)
        let localAudioUrl: string | null = null;
        try {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ppt-contest-audio');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            
            const filePath = path.join(uploadDir, path.basename(filename));
            fs.writeFileSync(filePath, buffer);
            localAudioUrl = `/uploads/ppt-contest-audio/${path.basename(filename)}`;
        } catch (e) {
            console.error("Local audio save failed", e);
        }

        // 2. Background Upload to Vercel (Optional)
        // Fire and forget
        put(`ppt-contest-audio/${path.basename(filename)}`, audio, { access: 'public' })
            .then(async (blob) => {
                 // Optionally update DB with remote URL later if needed
            })
            .catch(console.error);

        // 3. Save to DB
        await prisma.pPTInterpretation.create({
            data: {
                submissionId,
                audioUrl: localAudioUrl || "", // Use local URL primarily
                duration,
                timestamps: timestamps || "[]", // Save page timestamps
                speakerIp: ip,
            }
        });

        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "提交失败" };
    }
}

export async function getRandomInterpretationForVoting(excludeIds: string[] = []) {
    // Stage 3
    const count = await prisma.pPTInterpretation.count({
        where: {
            id: { notIn: excludeIds }
        }
    });

    if (count === 0) {
        return null;
    }
    
    const skip = Math.floor(Math.random() * count);
    const work = await prisma.pPTInterpretation.findFirst({
        where: {
            id: { notIn: excludeIds }
        },
        skip,
        include: {
            submission: true
        }
    });
    
    if (!work) return null;

    return {
        ...work,
        audioUrl: work.audioUrl, // Already local if saved that way
        submission: {
            ...work.submission,
            // Prioritize local URLs
            fileUrl: work.submission.localFileUrl || work.submission.fileUrl,
            previewUrl: work.submission.localPreviewUrl || work.submission.previewUrl
        }
    };
}

export async function voteInterpretation(id: string, increment: number = 1) {
    const status = await getContestStatus();
    const testMode = await getTestMode();
    if (!testMode && status.stage !== 3) {
        return { error: "当前不在投票阶段" };
    }
    
    await prisma.pPTInterpretation.update({
        where: { id },
        data: {
            votes: { increment: increment }
        }
    });
    
    return { success: true };
}
