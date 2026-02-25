import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export async function logAudit(
  action: string,
  resource: string,
  details?: string,
  userId?: string | null
) {
  try {
    // Get IP address
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown"

    await prisma.auditLog.create({
      data: {
        userId: userId,
        action,
        resource,
        details,
        ipAddress: ip,
      },
    })
  } catch (error) {
    console.error("Failed to write audit log:", error)
    // Don't throw error to avoid blocking main business logic
  }
}
