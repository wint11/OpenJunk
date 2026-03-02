import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
// @ts-ignore
import pdfParse from 'pdf-parse-fork'
import { prisma } from '@/lib/prisma'

// Configuration for DeepSeek API
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.AI_REVIEW_API_KEY
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1" // Standard DeepSeek endpoint

// AOI Dimension Definition
export interface AoiDimensions {
  rigor: number           // 严谨性
  reproducibility: number // 可复现性
  standardization: number // 规范性
  professionalism: number // 专业性
  objectivity: number     // 客观性
}

export interface AoiResult {
  dimensions: AoiDimensions
  baseScore: number
  duplicateFactor: number
  voteFactor: number
  totalScore: number
}

/**
 * Calculate AOI for a given novel
 * This function handles AI analysis, duplicate checking, and vote aggregation.
 */
export async function calculateAoi(novelId: string): Promise<AoiResult | null> {
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: { aoiVotes: true }
  })

  if (!novel) return null

  // 1. Get AI Dimensions (If not already calculated or force recalculate)
  // For now, we only calculate if all are 0 (initial state)
  let dimensions: AoiDimensions = {
    rigor: novel.aiRigor || 0,
    reproducibility: novel.aiReproducibility || 0,
    standardization: novel.aiStandardization || 0,
    professionalism: novel.aiProfessionalism || 0,
    objectivity: novel.aiObjectivity || 0
  }

  const isAiCalculated = Object.values(dimensions).some(v => v > 0)
  
  if (!isAiCalculated && DEEPSEEK_API_KEY) {
    try {
      const text = await extractTextFromNovel(novel)
      if (text) {
        const aiScore = await analyzeWithDeepSeek(text)
        if (aiScore) {
          dimensions = aiScore
          // Update DB with AI scores immediately
          await prisma.novel.update({
            where: { id: novelId },
            data: {
              aiRigor: dimensions.rigor,
              aiReproducibility: dimensions.reproducibility,
              aiStandardization: dimensions.standardization,
              aiProfessionalism: dimensions.professionalism,
              aiObjectivity: dimensions.objectivity
            }
          })
        }
      }
    } catch (error) {
      console.error("Failed to calculate AI score:", error)
    }
  }

  // 2. Base Score Calculation
  // Product of 5 dimensions
  // To avoid 0 making everything 0, we treat 0 as 1 for multiplication if it's not analyzed yet? 
  // No, the requirement says "Product of 5 dimensions". If AI fails, it remains 0.
  // If AI succeeds, scores are 0-10.
  let baseScore = dimensions.rigor * dimensions.reproducibility * dimensions.standardization * dimensions.professionalism * dimensions.objectivity

  // 3. Duplicate Submission Factor
  // If pdfHash exists, check if other novels have the same hash
  let duplicateFactor = 1.0
  if (novel.pdfHash) {
    const duplicateCount = await prisma.novel.count({
      where: {
        pdfHash: novel.pdfHash,
        id: { not: novelId } // Exclude self
      }
    })
    if (duplicateCount > 0) {
      duplicateFactor = 0.5
    }
  }

  // 4. Public Vote Factor
  // Base 1.0
  // Overreach (Academic Overreach) -> +0.01 (No limit)
  // Misconduct (Academic Misconduct) -> -0.01 (Min 0.01)
  const overreachVotes = novel.aoiVotes.filter(v => v.voteType === 'OVERREACH').length
  const misconductVotes = novel.aoiVotes.filter(v => v.voteType === 'MISCONDUCT').length
  
  let voteFactor = 1.0 + (overreachVotes * 0.01) - (misconductVotes * 0.01)
  if (voteFactor < 0.01) voteFactor = 0.01

  // 5. Total Score
  const totalScore = baseScore * duplicateFactor * voteFactor

  // Update Total Score in DB
  await prisma.novel.update({
    where: { id: novelId },
    data: { aoiScore: totalScore }
  })

  return {
    dimensions,
    baseScore,
    duplicateFactor,
    voteFactor,
    totalScore
  }
}

/**
 * Extract text from Novel (PDF or Description)
 */
async function extractTextFromNovel(novel: any): Promise<string> {
  // Priority 1: PDF File
  if (novel.pdfUrl && novel.pdfUrl.startsWith('/uploads/pdfs/')) {
    const filePath = path.join(process.cwd(), 'public', novel.pdfUrl)
    if (fs.existsSync(filePath)) {
      try {
        const dataBuffer = fs.readFileSync(filePath)
        const data = await pdfParse(dataBuffer)
        // Send a reasonable chunk, e.g., first 50k characters.
        // DeepSeek usually has a large context window (e.g., 32k or more).
        // Truncating too early might miss conclusion/methods.
        return data.text.slice(0, 50000)
      } catch (e) {
        console.error("PDF parse error:", e)
      }
    }
  }

  // Priority 2: Description + Title
  return `${novel.title}\n\n${novel.description || ""}`
}

/**
 * Call DeepSeek API to analyze text
 */
async function analyzeWithDeepSeek(text: string): Promise<AoiDimensions | null> {
  const client = new OpenAI({
    apiKey: DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL
  })

  // DeepSeek Chat usually supports 32k tokens. 
  // 50k chars is roughly 10k-15k tokens (depending on language), which is safe.
  const prompt = `
    Please analyze the following academic paper content and score it from 0 to 10 on these 5 dimensions:
    1. Rigor (严谨性)
    2. Reproducibility (可复现性)
    3. Standardization (规范性)
    4. Professionalism (专业性)
    5. Objectivity (客观性)

    Return ONLY a JSON object with integer scores. Format:
    {
      "rigor": number,
      "reproducibility": number,
      "standardization": number,
      "professionalism": number,
      "objectivity": number
    }

    Content:
    ${text.slice(0, 30000)}... (truncated if too long)
  `

  try {
    const response = await client.chat.completions.create({
      model: "deepseek-chat", // or deepseek-reasoner
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0].message.content
    if (!content) return null

    const result = JSON.parse(content)
    return {
      rigor: Number(result.rigor) || 0,
      reproducibility: Number(result.reproducibility) || 0,
      standardization: Number(result.standardization) || 0,
      professionalism: Number(result.professionalism) || 0,
      objectivity: Number(result.objectivity) || 0
    }
  } catch (e) {
    console.error("DeepSeek API error:", e)
    return null
  }
}
