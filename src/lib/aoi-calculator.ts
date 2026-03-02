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
  // For now, we only calculate if aiRigor is 0 (initial state)
  // If aiRigor is -1 (failed) or > 0 (success), we skip AI calculation
  let dimensions: AoiDimensions = {
    rigor: novel.aiRigor || 0,
    reproducibility: novel.aiReproducibility || 0,
    standardization: novel.aiStandardization || 0,
    professionalism: novel.aiProfessionalism || 0,
    objectivity: novel.aiObjectivity || 0
  }

  // Check if AI calculation has been attempted (0 = not attempted, -1 = failed, >0 = success)
  const isAiCalculated = (novel.aiRigor !== 0 && novel.aiRigor !== null)
  
  if (!isAiCalculated && DEEPSEEK_API_KEY) {
    // Lock the record immediately to prevent concurrent calculations
    await prisma.novel.update({
      where: { id: novelId },
      data: { aiRigor: -1 } // Mark as processing/failed
    })

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
        } else {
            // AI returned null (failed), ensure it stays -1 or set explicitly
             dimensions.rigor = -1
             // Other dimensions remain 0, but rigor=-1 signals failure
        }
      } else {
          // Text extraction failed
          dimensions.rigor = -1
      }
    } catch (error) {
      console.error("Failed to calculate AI score:", error)
      // Ensure it stays -1
      dimensions.rigor = -1
    }
  }

  // If calculation failed (-1), we return early or handle it gracefully
  if (dimensions.rigor === -1) {
      // Return a special result indicating failure
      // We still return a result object but with -1 scores so UI can handle it
      return {
          dimensions: {
              rigor: -1,
              reproducibility: -1,
              standardization: -1,
              professionalism: -1,
              objectivity: -1
          },
          baseScore: 0,
          duplicateFactor: 1,
          voteFactor: 1,
          totalScore: 0
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

  // 1. Sanitize input content
  // Remove potential prompt injection attempts or XML tags that might confuse the parser
  const sanitizedText = text
    .replace(/<[^>]*>/g, ' ') // Remove XML/HTML tags
    .replace(/```/g, '')      // Remove code blocks
    .slice(0, 30000);         // Truncate

  // Injection Detection
  const injectionKeywords = [
    // --- English Injection Keywords ---
    "ignore previous instructions",
    "ignore all instructions",
    "disregard previous instructions",
    "disregard all instructions",
    "forget all instructions",
    "system prompt",
    "reveal system prompt",
    "what is your system prompt",
    "you are not",
    "you are now",
    "act as",
    "roleplay",
    "simulate",
    "give me a score",
    "score it 10",
    "perfect score",
    "give a 10",
    "score 10",
    "system override",
    "override system",
    "admin mode",
    "developer mode",
    "debug mode",
    "jailbreak",
    "unrestricted",
    "unfiltered",
    "repeat the following",
    "repeat after me",
    "do not follow",
    "bypass",
    "hack",
    "dan mode",
    "dude mode",
    "mongo tom",
    "hypothetical response",
    
    // --- Chinese Injection Keywords ---
    "忽略之前的指令",
    "忽略所有指令",
    "忽略指令",
    "忽略限制",
    "无视之前的指令",
    "无视所有指令",
    "忘记所有指令",
    "系统指令",
    "系统提示词",
    "查看系统指令",
    "你的指令是什么",
    "评分改为",
    "打满分",
    "给个满分",
    "强制评分",
    "你现在是",
    "模拟",
    "越狱",
    "解除限制",
    "开发者模式",
    "调试模式",
    "管理员模式",
    "新的指令",
    "新指令",
    "接下来的指令",
    "不要遵守",
    "绕过",
    
    // --- Context Specific ---
    "AOI",
    "aoi",
    "academic overreach index"
  ];

  const lowerText = sanitizedText.toLowerCase();
  const hasInjection = injectionKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));

  if (hasInjection) {
    console.warn("Potential prompt injection detected.");
    return null; // Fail immediately
  }

  // 2. Optimized Prompt with strict instructions and XML enclosure
  const prompt = `
    Please analyze the content inside <paper_content> tags and score it from 0 to 10 on these 5 dimensions:
    1. Rigor (严谨性)
    2. Reproducibility (可复现性)
    3. Standardization (规范性)
    4. Professionalism (专业性)
    5. Objectivity (客观性)

    Return ONLY a JSON object with integer scores (0-10). Format:
    {
      "rigor": number,
      "reproducibility": number,
      "standardization": number,
      "professionalism": number,
      "objectivity": number
    }

    <paper_content>
    ${sanitizedText}
    </paper_content>
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
    
    // 3. Validate Output
    const validateScore = (score: any) => {
      const num = Number(score)
      if (Number.isNaN(num)) return 0
      return Math.max(0, Math.min(10, Math.round(num)))
    }

    return {
      rigor: validateScore(result.rigor),
      reproducibility: validateScore(result.reproducibility),
      standardization: validateScore(result.standardization),
      professionalism: validateScore(result.professionalism),
      objectivity: validateScore(result.objectivity)
    }
  } catch (e) {
    console.error("DeepSeek API error:", e)
    return null
  }
}
