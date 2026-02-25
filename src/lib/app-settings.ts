import { prisma } from "@/lib/prisma"

const AI_REVIEW_ENABLED_KEY = "AI_REVIEW_ENABLED"

export async function getAiReviewEnabled(): Promise<boolean> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: AI_REVIEW_ENABLED_KEY },
    select: { value: true },
  })

  return setting?.value === "true"
}

export async function setAiReviewEnabled(enabled: boolean): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: AI_REVIEW_ENABLED_KEY },
    create: { key: AI_REVIEW_ENABLED_KEY, value: enabled ? "true" : "false" },
    update: { value: enabled ? "true" : "false" },
  })
}
