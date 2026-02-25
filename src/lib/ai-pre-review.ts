export type AiPreReviewInput = {
  title: string
  description: string
  content: string
}

export type AiPreReviewResult = {
  pass: boolean
  qualityScore: number
  rawJson: string
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.round(n)))
}

function parsePass(value: unknown): boolean | null {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value > 0
  if (typeof value === "string") {
    const v = value.trim().toLowerCase()
    if (["true", "yes", "y", "pass", "passed", "通过"].includes(v)) return true
    if (["false", "no", "n", "fail", "failed", "不通过", "拒绝"].includes(v)) return false
  }
  return null
}

function normalizeResponse(json: unknown): { pass: boolean; qualityScore: number } {
  const obj = typeof json === "object" && json !== null ? (json as Record<string, unknown>) : {}
  const pass =
    parsePass(obj.pass) ??
    parsePass(obj.passed) ??
    parsePass(obj.approved) ??
    parsePass(obj["是否通过审核"]) ??
    false

  const qualityScore = clampInt(
    obj.qualityScore ?? obj.quality ?? obj.score ?? obj["文章质量"] ?? 0,
    0,
    10
  )

  return { pass, qualityScore }
}

function heuristicReview(input: AiPreReviewInput): AiPreReviewResult {
  const content = input.content?.trim() ?? ""
  const len = content.length

  let qualityScore = 0
  if (len >= 5000) qualityScore = 9
  else if (len >= 2000) qualityScore = 8
  else if (len >= 800) qualityScore = 7
  else if (len >= 400) qualityScore = 6
  else if (len >= 200) qualityScore = 5
  else if (len >= 100) qualityScore = 4
  else qualityScore = 2

  const pass = qualityScore >= 6
  const rawJson = JSON.stringify(
    { 是否通过审核: pass, 文章质量: qualityScore, provider: "heuristic" },
    null,
    2
  )

  return { pass, qualityScore, rawJson }
}

export async function runAiPreReview(input: AiPreReviewInput): Promise<AiPreReviewResult> {
  const endpoint = process.env.AI_REVIEW_ENDPOINT || process.env.AI_REVIEW_BASE_URL
  if (!endpoint) return heuristicReview(input)

  const apiKey = process.env.AI_REVIEW_API_KEY
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      content: input.content,
      responseFormat: {
        是否通过审核: "boolean",
        文章质量: "number(0-10)",
      },
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    return {
      pass: false,
      qualityScore: 0,
      rawJson: JSON.stringify(
        { error: `AI_REVIEW_ENDPOINT responded ${res.status}`, responseText: text },
        null,
        2
      ),
    }
  }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return {
      pass: false,
      qualityScore: 0,
      rawJson: JSON.stringify({ error: "Invalid JSON from AI_REVIEW_ENDPOINT", responseText: text }, null, 2),
    }
  }

  const normalized = normalizeResponse(json)
  return {
    pass: normalized.pass,
    qualityScore: normalized.qualityScore,
    rawJson: JSON.stringify(json, null, 2),
  }
}
