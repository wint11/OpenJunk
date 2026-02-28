'use server'

import { prisma } from "@/lib/prisma"
import OpenAI from "openai"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
})

export async function saveDesign(journalId: string, config: string | null) {
  try {
    await prisma.journal.update({
      where: { id: journalId },
      data: { customConfig: config }
    })
    revalidatePath(`/journals/${journalId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to save design:", error)
    return { success: false, error: "Failed to save design" }
  }
}

export async function generateDesign(prompt: string, currentCode: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" }
    }

    const userId = session.user.id
    const userRole = session.user.role

    // --- Rate Limit Check ---
    if (userRole !== 'SUPER_ADMIN') {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { aiDesignUsage: true }
      })

      let usage = { date: today, count: 0 }
      if (user?.aiDesignUsage) {
        try {
          const parsed = JSON.parse(user.aiDesignUsage)
          if (parsed.date === today) {
            usage = parsed
          }
        } catch (e) {
          // ignore parsing error, reset usage
        }
      }

      if (usage.count >= 20) {
        return { success: false, error: "您今日的 AI 装修次数已达上限 (20次/天)。请明天再试，或联系总编操作。" }
      }

      // Increment usage
      usage.count += 1
      await prisma.user.update({
        where: { id: userId },
        data: { aiDesignUsage: JSON.stringify(usage) }
      })
    }
    // --- End Rate Limit Check ---

    const systemPrompt = `You are an expert web designer.
    You are helping a user customize their journal homepage template (HTML/Handlebars/Tailwind).
    
    INSTEAD of returning the full code, you MUST return a JSON array of "edits".
    Each edit is an object with "search" and "replace" fields.
    The "search" field should contain a UNIQUE block of code from the current template.
    The "replace" field should contain the new code to replace it with.
    
    Guidelines:
    1. Keep search blocks small but unique enough to match.
    2. You can provide multiple edits in the array to change different parts of the page.
    3. If you need to add something new (like a footer), find the end of a section or the </body> tag and include it in your search/replace.
    4. Return ONLY the raw JSON array. No markdown, no explanations.
    
    Format:
    [
      { "search": "old code snippet", "replace": "new code snippet" },
      ...
    ]
    
    Current Template:
    ${currentCode}
    `

    const response = await openai.chat.completions.create({
      model: "deepseek-coder",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      stream: false,
      response_format: { type: 'json_object' } // Force JSON if supported, or just rely on prompt
    })

    const content = response.choices[0].message.content
    if (!content) return { success: false, error: "Empty response from AI" }

    try {
      // AI might return { "edits": [...] } or just the array [...]
      const parsed = JSON.parse(content)
      const edits = Array.isArray(parsed) ? parsed : parsed.edits
      
      if (!Array.isArray(edits)) {
        return { success: false, error: "Invalid JSON format from AI" }
      }

      let updatedCode = currentCode
      for (const edit of edits) {
        if (edit.search && edit.replace) {
          // Check if search string exists
          if (updatedCode.includes(edit.search)) {
            updatedCode = updatedCode.replace(edit.search, edit.replace)
          } else {
            console.warn("AI search block not found in code:", edit.search)
          }
        }
      }

      return { success: true, code: updatedCode }
    } catch (e) {
      console.error("Failed to parse AI JSON:", content)
      return { success: false, error: "AI returned invalid JSON" }
    }
  } catch (error) {
    console.error("Failed to generate design:", error)
    return { success: false, error: "Failed to generate design" }
  }
}
