
'use server'

import { prisma } from "@/lib/prisma"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { extractTextFromDocx } from "@/lib/docx-extractor"
import OpenAI from "openai"
import { v4 as uuidv4 } from "uuid"

// --- Types ---
export type ManuscriptData = {
  title: string
  authors: string[]
  abstract: string
  keywords: string[]
  sections: { 
    heading: string
    content: string[] // Array of paragraphs
    subsections?: {
        heading: string
        content: string[]
    }[]
  }[]
}

export type ActionResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  url?: string
}

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

// --- AI Extraction ---
export async function extractManuscriptData(formData: FormData): Promise<ActionResponse<ManuscriptData>> {
  try {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: "未上传文件" }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractTextFromDocx(buffer)
    
    // Truncate to avoid context limit (e.g., 20k chars)
    // DeepSeek handles 32k context easily, so we can be generous.
    const truncatedText = text.slice(0, 25000)

    const prompt = `
      You are an academic formatting assistant. Extract the structured content from the following research paper text.
      Return strictly valid JSON matching this schema:
      {
        "title": "Paper Title",
        "authors": ["Author 1", "Author 2"],
        "abstract": "Full abstract text...",
        "keywords": ["Keyword1", "Keyword2"],
        "sections": [
           { 
             "heading": "1. Introduction", 
             "content": ["Paragraph 1...", "Paragraph 2..."],
             "subsections": [
                { "heading": "1.1 Background", "content": ["Para 1...", "Para 2..."] }
             ]
           }
        ]
      }
      
      Rules:
      1. Identify main sections (e.g., Introduction, Methods) and subsections (e.g., 2.1, 2.2).
      2. Split content into an array of paragraphs string[].
      3. Clean up text: remove page numbers, headers/footers within text.
      4. If no subsections exist, return empty array for "subsections".

      Paper Text:
      "${truncatedText}"
    `

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "deepseek-chat",
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error("AI returned empty content")
    
    const data = JSON.parse(content) as ManuscriptData
    return { success: true, data }

  } catch (error) {
    console.error("Extraction error:", error)
    return { success: false, error: "AI 解析失败，请重试" }
  }
}

// --- Docx Generation ---
export async function generateFormattedDocx(journalId: string, data: ManuscriptData): Promise<ActionResponse> {
  try {
    // 1. Load Template
    // In a real app, fetch template path from DB (journal.templateUrl)
    // Here we check for a specific journal template or fallback
    const templatesDir = join(process.cwd(), 'public', 'templates')
    let templatePath = join(templatesDir, `journal-${journalId}.docx`)
    
    if (!existsSync(templatePath)) {
        templatePath = join(templatesDir, 'default-issue.docx') // Fallback to default
    }
    
    if (!existsSync(templatePath)) {
        // Fallback if no template at all
        return { success: false, error: "未找到该期刊的排版模板 (public/templates/default-issue.docx)" }
    }

    const content = await readFile(templatePath, "binary")
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    })

    // 2. Prepare Data for Docxtemplater
    // Flatten authors array to object list if template expects loop
    const renderData = {
        title: data.title,
        abstract: data.abstract,
        keywords: data.keywords.join(', '),
        authors: data.authors.map(a => ({ name: a })), 
        sections: data.sections.map(s => ({
            heading: s.heading,
            content: s.content, // Now an array, template should use {#content}{.}{/content}
            subsections: s.subsections?.map(sub => ({
                heading: sub.heading,
                content: sub.content
            })) || []
        }))
    }

    // 3. Render
    doc.render(renderData)

    // 4. Save
    const outputDir = join(process.cwd(), 'public', 'generated-manuscripts')
    if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true })
    }

    const outputFileName = `formatted-${uuidv4()}.docx`
    const outputPath = join(outputDir, outputFileName)
    
    const buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
    })

    await writeFile(outputPath, buffer)

    return {
        success: true,
        url: `/generated-manuscripts/${outputFileName}`
    }

  } catch (error) {
    console.error("Generation error:", error)
    return { success: false, error: "生成文档失败" }
  }
}
