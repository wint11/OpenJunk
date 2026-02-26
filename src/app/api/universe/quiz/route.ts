import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"
import fs from "fs"
import path from "path"
import { auth } from "@/auth"

// Switch to pdf-parse-fork which handles node environment better or stick to pdf-parse but careful
// Actually, let's try a different strategy: Using `pdfjs-dist/legacy/build/pdf.js` if available or just raw text extraction if possible.
// But `pdf-parse-fork` is a common drop-in replacement that fixes some of these issues.
const pdf = require("pdf-parse-fork");

// Initialize OpenAI client with DeepSeek configuration
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const journalId = searchParams.get("journalId")
    
    // Get user session
    const session = await auth()
    const userId = session?.user?.id
    // Simple check if user is admin based on session data or DB lookup
    // Assuming session.user.role is available if we customized the session callback, 
    // otherwise we fetch from DB. Let's fetch from DB to be safe and get the role.
    
    const clientIp = request.headers.get("x-forwarded-for") || "unknown"

    if (!journalId) {
      return NextResponse.json({ error: "Journal ID is required" }, { status: 400 })
    }

    // --- Rate Limit Check ---
    // Limit: 3 attempts per day globally (across all journals)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const attemptsCount = await prisma.userQuizAttempt.count({
      where: {
        OR: [
          userId ? { userId } : {},
          { guestIp: clientIp }
        ],
        createdAt: {
          gte: today
        }
      }
    })

    // Identify Editor/Admin
    let isEditor = false
    if (userId) {
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { role: true }
      })
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        isEditor = true
      }
    }

    if (!isEditor && attemptsCount >= 3) {
      return NextResponse.json({ 
        error: "Daily limit reached (3/3)", 
        limitReached: true 
      }, { status: 429 })
    }

    // --- Quiz Retrieval Logic (5:1 New vs Cached) ---
    // 1. Try to fetch cached quiz
    // 5:1 ratio means 5 parts new, 1 part cached. Total 6 parts.
    // Chance of cached = 1/6 ≈ 0.166...
    // Chance of new = 5/6 ≈ 0.833...
    const shouldFetchCached = Math.random() > (5/6) 
    
    if (shouldFetchCached) {
      const cachedQuizCount = await prisma.quiz.count({
        where: { journalId }
      })
      
      if (cachedQuizCount > 0) {
        const skip = Math.floor(Math.random() * cachedQuizCount)
        const cachedQuiz = await prisma.quiz.findFirst({
          where: { journalId },
          skip
        })
        
        if (cachedQuiz) {
          return NextResponse.json({
            ...cachedQuiz,
            options: JSON.parse(cachedQuiz.options),
            fromCache: true
          })
        }
      }
    }

    // 2. Generate New Quiz (Fallback or 66% chance)
    // ... Existing generation logic ...
    
    // 1. Randomly select a published paper from this journal
    const paperCount = await prisma.novel.count({
      where: {
        journalId,
        status: "PUBLISHED",
        pdfUrl: { not: null } // Ensure PDF exists
      }
    })

    if (paperCount === 0) {
      return NextResponse.json({ error: "No papers available for this journal" }, { status: 404 })
    }

    const skip = Math.floor(Math.random() * paperCount)
    const randomPaper = await prisma.novel.findFirst({
      where: {
        journalId,
        status: "PUBLISHED",
        pdfUrl: { not: null }
      },
      skip,
      select: {
        id: true,
        title: true,
        pdfUrl: true,
        description: true
      }
    })

    if (!randomPaper || !randomPaper.pdfUrl) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 })
    }

    // 2. Read PDF content
    // Assuming pdfUrl is a local path like "/uploads/pdfs/sample.pdf"
    // Remove leading slash to get relative path from project root
    const relativePath = randomPaper.pdfUrl.startsWith('/') 
      ? randomPaper.pdfUrl.slice(1) 
      : randomPaper.pdfUrl
    
    const absolutePath = path.join(process.cwd(), 'public', relativePath)

    let textContent = ""
    
    if (fs.existsSync(absolutePath)) {
      try {
        const dataBuffer = fs.readFileSync(absolutePath)
        const pdfData = await pdf(dataBuffer).catch(() => null)
        
        if (pdfData && pdfData.text) {
          const fullText = pdfData.text
          const totalLength = fullText.length
          
          // Randomly select a slice of the text to ensure variety
          // Target length: 3000 chars
          // Avoid the very end (references) if possible, say last 10%
          const effectiveLength = Math.max(totalLength * 0.9, 3000)
          
          // Random start position between 0 and (effectiveLength - 3000)
          const maxStart = Math.max(0, effectiveLength - 3000)
          const start = Math.floor(Math.random() * maxStart)
          
          textContent = fullText.slice(start, start + 3000)
          
          console.log(`[Quiz] Selected paper: "${randomPaper.title}" (Pool size: ${paperCount}). Extracted text from index ${start} to ${start + 3000} (Total: ${totalLength})`)
        }
      } catch (err) {
        console.error("PDF parse failed:", err)
      }
    } else {
      console.warn(`PDF file not found at: ${absolutePath}, using description instead.`)
    }

    // Fallback if PDF text extraction failed
    if (!textContent || textContent.length < 50) {
      textContent = randomPaper.description || "暂无详细内容，请根据标题进行推断。"
    }

    // 3. Generate quiz using DeepSeek
    const prompt = `
      基于以下学术论文片段，生成一道单项选择题。
      题目应当考察对论文内容的理解。
      
      论文标题: ${randomPaper.title}
      论文片段:
      ${textContent}
      
      请严格按照以下 JSON 格式返回（不要包含 Markdown 代码块标记）：
      {
        "question": "题目内容",
        "options": ["选项A", "选项B", "选项C", "选项D"],
        "correctAnswer": 0, // 0-3 代表正确选项的索引
        "explanation": "简短解析"
      }
    `

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "deepseek-chat",
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error("Empty response from AI")
    }

    const quizData = JSON.parse(content)

    // Save generated quiz to database cache
    const savedQuiz = await prisma.quiz.create({
      data: {
        journalId,
        paperId: randomPaper.id,
        paperTitle: randomPaper.title,
        question: quizData.question,
        options: JSON.stringify(quizData.options),
        correctAnswer: quizData.correctAnswer,
        explanation: quizData.explanation
      }
    })

    return NextResponse.json({
      id: savedQuiz.id,
      paperId: randomPaper.id,
      paperTitle: randomPaper.title,
      ...quizData,
      fromCache: false
    })

  } catch (error) {
    console.error("Quiz generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    )
  }
}
